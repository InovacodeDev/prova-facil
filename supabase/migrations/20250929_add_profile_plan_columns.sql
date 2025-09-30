do $$
DECLARE
  -- Variável para armazenar o nome da coluna arquivada. Útil para evitar nomes duplicados.
  archived_column_name TEXT := 'plan_archived_text_' || to_char(NOW(), 'YYYYMMDD');
BEGIN
  -- 1) Criar o tipo ENUM se ele não existir.
  -- Esta parte já é não destrutiva.
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_plan_enum') THEN
    CREATE TYPE profile_plan_enum AS ENUM ('starter','basic','essentials','plus','advanced');
  END IF;

  -- 2) Verificar se a coluna `plan` existe na tabela `profiles`.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan'
  ) THEN
    -- A coluna não existe, então podemos adicioná-la com segurança.
    ALTER TABLE public.profiles ADD COLUMN plan profile_plan_enum DEFAULT 'starter';

  ELSE
    -- A coluna `plan` existe. Vamos verificar se ela precisa de conversão.
    IF (SELECT udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan') != 'profile_plan_enum' THEN
      -- A coluna existe, mas não é do tipo ENUM. Esta é a seção que modificamos.

      -- Passo 1: (NÃO DESTRUTIVO) Renomear a coluna antiga para arquivá-la, em vez de deletá-la.
      -- Isso preserva 100% dos dados originais para auditoria.
      EXECUTE format('ALTER TABLE public.profiles RENAME COLUMN plan TO %I', archived_column_name);

      -- Passo 2: Adicionar a nova coluna `plan` com o tipo ENUM correto.
      ALTER TABLE public.profiles ADD COLUMN plan profile_plan_enum DEFAULT 'starter';

      -- Passo 3: (NÃO DESTRUTIVO) Copiar os dados da coluna arquivada para a nova.
      -- Se o valor antigo for válido, ele é convertido.
      -- Se for inválido, a nova coluna fica NULL, sinalizando a necessidade de revisão,
      -- mas o valor original ainda existe na coluna arquivada.
      EXECUTE format('
        UPDATE public.profiles
        SET plan = CASE
          WHEN %I IN (''starter'',''basic'',''essentials'',''plus'',''advanced'') THEN %I::profile_plan_enum
          ELSE NULL -- Marcamos como NULL para indicar um valor inválido que precisa de atenção.
        END;',
        archived_column_name, archived_column_name
      );

      RAISE NOTICE 'A coluna "plan" foi convertida para o tipo ENUM. A coluna original foi renomeada para % para fins de auditoria.', archived_column_name;
    END IF;
  END IF;                                                                                                                                                             
                                                                                                                                                                       
  -- 3) Ensure plan_expire_at exists                                                                                                                                   
  IF NOT EXISTS (                                                                                                                                                      
    SELECT 1 FROM information_schema.columns                                                                                                                           
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan_expire_at'                                                                       
  ) THEN                                                                                                                                                               
    ALTER TABLE public.profiles ADD COLUMN plan_expire_at TIMESTAMPTZ;                                                                                                 
  END IF;                                                                                                                                                              
                                                                                                                                                                       
  -- 4) Ensure index on user_id exists (idempotent)                                                                                                                    
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_profiles_user_id') THEN                                 
    CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);                                                                                                     
  END IF;                                                                                                                                                              
END                                                                                                                                                                    
$$