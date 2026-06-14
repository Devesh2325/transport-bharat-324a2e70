
CREATE POLICY "branding public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'branding');
CREATE POLICY "branding company upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding' AND (storage.foldername(name))[1] = public.current_company_id()::text);
CREATE POLICY "branding company update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding' AND (storage.foldername(name))[1] = public.current_company_id()::text);
CREATE POLICY "branding company delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding' AND (storage.foldername(name))[1] = public.current_company_id()::text);
