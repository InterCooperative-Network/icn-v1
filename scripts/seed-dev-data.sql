-- Minimal development seed data
INSERT INTO cooperatives (legal_name, display_name, domain, jurisdiction, cooperative_type, governance_model, economic_model, founding_date, contact_email)
VALUES
('Alpha Workers Cooperative', 'Alpha Coop', 'alpha.coop', 'Test State', 'worker', 'majority', 'surplus_sharing', CURRENT_DATE, 'contact@alpha.coop'),
('Beta Community Cooperative', 'Beta Coop', 'beta.coop', 'Test State', 'multi_stakeholder', 'consensus_minus_one', 'time_banking', CURRENT_DATE, 'hello@beta.coop')
ON CONFLICT DO NOTHING;


