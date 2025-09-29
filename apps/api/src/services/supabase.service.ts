import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// Do not initialize the Supabase client at module load time to avoid hard failures
// when env vars are not present (especially in local dev or when running parts of the app).
function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url) throw new Error("SUPABASE_URL is required for server-side Supabase operations");
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE (service key) is required for server-side Supabase operations");

    const g = global as any;
    if (g.__supabaseAdmin) return g.__supabaseAdmin as SupabaseClient;
    const client = createClient(url, key);
    g.__supabaseAdmin = client;
    return client;
}

const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().optional(),
});
const SigninSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const ChangePasswordSchema = z.object({ newPassword: z.string().min(8) });
const CreateAssessmentSchema = z.object({ title: z.string().optional(), content: z.any().optional() });
const UpdateProfileSchema = z
    .object({ full_name: z.string().optional(), avatar_url: z.string().url().optional() })
    .passthrough();
const RpcQuerySchema = z.object({
    table: z.string(),
    select: z.string().optional(),
    filter: z.record(z.any()).optional(),
    action: z.enum(["select", "delete"]).optional(),
    order: z.object({ by: z.string(), direction: z.enum(["asc", "desc"]).optional() }).optional(),
});

@Injectable()
export class SupabaseService {
    async signup(body: unknown): Promise<any> {
        const parse = SignupSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const { email, password, full_name } = parse.data;

        try {
            const { data: user, error } = await getSupabaseAdmin().auth.admin.createUser({
                email,
                password,
                email_confirm: false,
                user_metadata: { full_name },
            });
            if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            try {
                await getSupabaseAdmin()
                    .from("profiles")
                    .insert({ id: (user as any).id, full_name, email });
            } catch (e) {
                console.warn("profile insert failed", e);
            }
            return { user };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "signup failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async signin(body: unknown): Promise<any> {
        const parse = SigninSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const { email, password } = parse.data;
        try {
            const { data, error } = await getSupabaseAdmin().auth.signInWithPassword({ email, password });
            if (error) throw new HttpException({ error: error.message }, HttpStatus.UNAUTHORIZED);
            return data;
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "signin failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async changePassword(token: string | null, body: unknown): Promise<any> {
        if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
        const parse = ChangePasswordSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const { newPassword } = parse.data;
        try {
            const {
                data: { user },
                error: userErr,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (userErr || !user)
                throw new HttpException({ error: userErr?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
            const { error } = await getSupabaseAdmin().auth.admin.updateUserById((user as any).id, {
                password: newPassword,
            });
            if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            return { ok: true };
        } catch (e: any) {
            console.error(e);
            throw new HttpException(
                { error: e?.message || "change password failed" },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async me(token: string | null): Promise<any> {
        if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
        try {
            const {
                data: { user },
                error,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (error || !user)
                throw new HttpException({ error: error?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
            return { user };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "me failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createAssessment(token: string | null, body: unknown): Promise<any> {
        if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
        const parse = CreateAssessmentSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const payload = parse.data;
        try {
            const {
                data: { user },
                error: userErr,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (userErr || !user)
                throw new HttpException({ error: userErr?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
            const row = { ...payload, user_id: (user as any).id, created_at: new Date().toISOString() };
            const { data, error } = await getSupabaseAdmin().from("assessments").insert(row).select();
            if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            return { data };
        } catch (e: any) {
            console.error(e);
            throw new HttpException(
                { error: e?.message || "create assessment failed" },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateProfile(token: string | null, body: unknown): Promise<any> {
        if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
        const parse = UpdateProfileSchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        try {
            const {
                data: { user },
                error: userErr,
            } = await getSupabaseAdmin().auth.getUser(token);
            if (userErr || !user)
                throw new HttpException({ error: userErr?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
            const updates = { ...parse.data, updated_at: new Date().toISOString() };
            const { data, error } = await getSupabaseAdmin()
                .from("profiles")
                .update(updates)
                .eq("id", (user as any).id)
                .select();
            if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            return { data };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "profile update failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async rpcQuery(body: unknown, token: string | null = null): Promise<any> {
        const parse = RpcQuerySchema.safeParse(body || {});
        if (!parse.success)
            throw new HttpException(
                { error: "invalid payload", details: parse.error.format() },
                HttpStatus.BAD_REQUEST
            );
        const { table, select, filter, action, order } = parse.data;
        try {
            if (action === "delete") {
                if (!token) throw new HttpException({ error: "missing token" }, HttpStatus.UNAUTHORIZED);
                const {
                    data: { user },
                    error: userErr,
                } = await getSupabaseAdmin().auth.getUser(token);
                if (userErr || !user)
                    throw new HttpException({ error: userErr?.message || "invalid token" }, HttpStatus.UNAUTHORIZED);
                if (!filter || typeof filter !== "object")
                    throw new HttpException({ error: "filter required for delete" }, HttpStatus.BAD_REQUEST);
                const match = { ...filter } as Record<string, any>;
                if (!Object.prototype.hasOwnProperty.call(match, "user_id")) match.user_id = (user as any).id;
                const { data, error } = await getSupabaseAdmin().from(table).delete().match(match).select();
                if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
                return { data };
            }

            let q: any = getSupabaseAdmin()
                .from(table)
                .select(select || "*");
            if (filter && typeof filter === "object") Object.entries(filter).forEach(([k, v]) => (q = q.eq(k, v)));
            if (order && typeof order === "object" && order.by)
                q = q.order(order.by, { ascending: (order.direction || "asc").toLowerCase() !== "desc" });
            const { data, error } = await q;
            if (error) throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
            return { data };
        } catch (e: any) {
            console.error(e);
            throw new HttpException({ error: e?.message || "query failed" }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
