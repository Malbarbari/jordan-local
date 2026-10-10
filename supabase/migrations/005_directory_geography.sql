-- Expand only provider directory geography. API v1 activities stay unchanged.
-- Existing owner policies and onboarding derive ownership from auth.uid().
begin;
alter table public.businesses drop constraint businesses_location_id_check;
alter table public.businesses add constraint businesses_location_id_check
 check(location_id in ('amman','irbid','ajloun','jerash','umm-qais','as-salt','madaba','dana','wadi-rum',
 'pella','jordan-valley','dead-sea','wadi-mujib','main','mount-nebo','baptism-site','petra','aqaba'));
commit;
