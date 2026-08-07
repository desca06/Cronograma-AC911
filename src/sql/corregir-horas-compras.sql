BEGIN;

UPDATE ordenes_compra
SET creado_en = creado_en + INTERVAL '6 hours'
WHERE creado_en < TIMESTAMP '2026-08-07 18:04:00';

UPDATE orden_compra_eventos
SET creado_en = creado_en + INTERVAL '6 hours'
WHERE creado_en < TIMESTAMP '2026-08-07 18:04:00';

UPDATE orden_compra_items
SET creado_en = creado_en + INTERVAL '6 hours'
WHERE creado_en < TIMESTAMP '2026-08-07 18:04:00';

COMMIT;