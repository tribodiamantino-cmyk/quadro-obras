-- Adicionar campos para entrega GSI
-- gsi_forecast_date: Data prevista da entrega GSI (preenchida pelo usuário)
-- gsi_actual_date: Data efetiva da chegada GSI (preenchida automaticamente pelo botão)

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS gsi_forecast_date DATE,
ADD COLUMN IF NOT EXISTS gsi_actual_date DATE;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN projects.gsi_forecast_date IS 'Data prevista para entrega GSI (preenchida manualmente)';
COMMENT ON COLUMN projects.gsi_actual_date IS 'Data efetiva da chegada GSI (validada automaticamente)';