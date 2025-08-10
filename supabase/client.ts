import { createClient } from "@supabase/supabase-js";

const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://hjwyujjlrgldwviylycz.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqd3l1ampscmdsZHd2aXlseWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDg3NjIsImV4cCI6MjA3MDQyNDc2Mn0.r0rtsbSyULkXUuYpKKxWxxNZqYViny60_KmWiS8cVt8"
);

export default client;
