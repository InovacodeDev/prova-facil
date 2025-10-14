/**
 * Script para Popular plan_id em Profiles Existentes
 *
 * Este script busca todos os profiles com stripe_subscription_id ativo
 * e define o plan_id correto com base no produto do Stripe.
 *
 * Uso:
 * ```bash
 * # Certifique-se de ter as variáveis de ambiente configuradas
 * pnpm tsx scripts/populate-plan-ids.ts
 * ```
 *
 * Variáveis de ambiente necessárias:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (não use anon key!)
 * - STRIPE_SECRET_KEY
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Validar variáveis de ambiente
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !STRIPE_SECRET_KEY) {
  console.error('❌ Variáveis de ambiente faltando:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
  console.error('  STRIPE_SECRET_KEY:', !!STRIPE_SECRET_KEY);
  process.exit(1);
}

// Inicializar clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.clover' });

interface Profile {
  id: string;
  email: string;
  stripe_subscription_id: string;
  plan_id: string;
}

/**
 * Busca plan_id a partir do Stripe product_id
 */
async function getPlanIdFromStripeProduct(productId: string): Promise<string | null> {
  const { data, error } = await supabase.from('plans').select('id').eq('stripe_product_id', productId).single();

  if (error || !data) {
    console.warn(`⚠️  Plano não encontrado para product ${productId}`);
    return null;
  }

  return data.id;
}

/**
 * Processa um único profile
 */
async function processProfile(profile: Profile): Promise<boolean> {
  try {
    console.log(`\n📋 Processando profile ${profile.email}...`);

    // 1. Buscar subscription no Stripe
    console.log(`   🔍 Buscando subscription ${profile.stripe_subscription_id}...`);
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

    // 2. Extrair product_id
    const item = subscription.items.data[0];
    if (!item?.price?.product) {
      console.error(`   ❌ Subscription sem produto associado`);
      return false;
    }

    const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;
    console.log(`   📦 Product ID: ${productId}`);

    // 3. Buscar plan_id correspondente
    const planId = await getPlanIdFromStripeProduct(productId);

    if (!planId) {
      console.error(`   ❌ Plan não encontrado para product ${productId}`);
      return false;
    }

    console.log(`   🎯 Plan ID: ${planId}`);

    // 4. Verificar se precisa atualizar
    if (profile.plan_id === planId) {
      console.log(`   ✅ Plan já está correto (${planId}), pulando...`);
      return true;
    }

    // 5. Atualizar profile
    const { error } = await supabase.from('profiles').update({ plan_id: planId }).eq('id', profile.id);

    if (error) {
      console.error(`   ❌ Erro ao atualizar profile:`, error);
      return false;
    }

    console.log(`   ✅ Profile atualizado: ${profile.plan_id} → ${planId}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Erro ao processar profile:`, error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando população de plan_id...\n');

  // 1. Buscar profiles com subscription ativa
  console.log('📊 Buscando profiles com subscription ativa...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, stripe_subscription_id, plan_id')
    .not('stripe_subscription_id', 'is', null);

  if (error) {
    console.error('❌ Erro ao buscar profiles:', error);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('ℹ️  Nenhum profile com subscription ativa encontrado.');
    process.exit(0);
  }

  console.log(`✅ Encontrados ${profiles.length} profiles com subscription\n`);

  // 2. Processar cada profile
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const profile of profiles) {
    const success = await processProfile(profile);

    if (success) {
      if (profile.plan_id !== 'starter') {
        skippedCount++;
      } else {
        successCount++;
      }
    } else {
      errorCount++;
    }
  }

  // 3. Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Atualizados com sucesso: ${successCount}`);
  console.log(`⏭️  Pulados (já corretos):  ${skippedCount}`);
  console.log(`❌ Erros:                   ${errorCount}`);
  console.log(`📊 Total processados:       ${profiles.length}`);
  console.log('='.repeat(60));

  // 4. Validação final
  console.log('\n🔍 Executando validação final...\n');

  const { data: validation, error: validationError } = await supabase.rpc('validate_plan_ids', {});

  if (validationError) {
    // Se a função RPC não existir, fazer validação manual
    const { data: invalidProfiles } = await supabase
      .from('profiles')
      .select('id, email, plan_id, stripe_subscription_id')
      .not('stripe_subscription_id', 'is', null)
      .eq('plan_id', 'starter');

    if (invalidProfiles && invalidProfiles.length > 0) {
      console.log(`⚠️  Ainda existem ${invalidProfiles.length} profiles com subscription mas plan_id = starter:`);
      invalidProfiles.forEach((p) => {
        console.log(`   - ${p.email} (${p.id})`);
      });
    } else {
      console.log('✅ Validação OK: Todos os profiles com subscription têm plan_id correto');
    }
  }

  console.log('\n✨ Script concluído!\n');
}

// Executar script
main().catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
