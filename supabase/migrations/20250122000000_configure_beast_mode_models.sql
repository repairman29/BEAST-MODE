-- Configure BEAST MODE Models
-- This migration creates/updates the primary BEAST MODE code generation model

-- BEAST MODE Code Generator (Primary Model)
INSERT INTO custom_models (
  model_id,
  model_name,
  endpoint_url,
  provider,
  is_active,
  is_public,
  config,
  description,
  user_id
) VALUES (
  'beast-mode-code-generator',
  'BEAST MODE Code Generator',
  'https://api.beast-mode.dev/v1/chat/completions',
  'openai-compatible',
  true,
  true,
  '{"model": "beast-mode-code-generator", "temperature": 0.3, "max_tokens": 4000}'::jsonb,
  'Primary code generation model for BEAST MODE - the galaxy''s best vibe-coder''s oasis',
  NULL
)
ON CONFLICT (model_id) DO UPDATE SET
  model_name = EXCLUDED.model_name,
  endpoint_url = EXCLUDED.endpoint_url,
  provider = EXCLUDED.provider,
  is_active = EXCLUDED.is_active,
  is_public = EXCLUDED.is_public,
  config = EXCLUDED.config,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the model was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM custom_models 
    WHERE model_id = 'beast-mode-code-generator' 
    AND is_active = true
  ) THEN
    RAISE NOTICE '✅ BEAST MODE Code Generator model configured successfully';
  ELSE
    RAISE WARNING '⚠️  BEAST MODE Code Generator model not found or inactive';
  END IF;
END $$;
