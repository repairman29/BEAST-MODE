
-- Add porkbun to allowed providers in user_api_keys table
ALTER TABLE user_api_keys 
DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;

ALTER TABLE user_api_keys 
ADD CONSTRAINT user_api_keys_provider_check 
CHECK (provider IN ('openai', 'mistral', 'gemini', 'groq', 'anthropic', 'together', 'porkbun'));
