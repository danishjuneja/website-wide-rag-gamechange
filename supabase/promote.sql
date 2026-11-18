-- Replace the UUID only after coverage reconciliation and the evaluation gate.
-- Execute as a privileged operator; never expose the service key to the browser.
do $$
declare
 candidate uuid := '00000000-0000-0000-0000-000000000000';
 -- User-approved catalogue completeness limitation. Keep funds labelled incomplete.
 accepted_incomplete_categories text[] := array['funds'];
begin
 if not exists(select 1 from public.rag_chunks where version_id=candidate) then raise exception 'No chunks in candidate version'; end if;
 if not exists(select 1 from public.rag_products where version_id=candidate and verified) then raise exception 'No verified products in candidate version'; end if;
 if not exists(select 1 from public.rag_categories where version_id=candidate) or exists(select 1 from public.rag_categories where version_id=candidate and not reconciled and not (category = any(accepted_incomplete_categories))) then raise exception 'Product categories are not reconciled'; end if;
 insert into public.rag_active_version(singleton,version_id) values(true,candidate)
 on conflict(singleton) do update set version_id=excluded.version_id;
end $$;
