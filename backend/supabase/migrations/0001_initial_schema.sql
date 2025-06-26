-- Elders table
CREATE TABLE elders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    timezone TEXT DEFAULT 'America/Toronto',
    voice_preference TEXT DEFAULT 'twilio' CHECK (voice_preference IN ('twilio', 'cloned')),
    consent_cloned_voice BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caregivers table
CREATE TABLE caregivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'silver', 'gold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Care team relationships
CREATE TABLE care_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID REFERENCES caregivers(id),
    elder_id UUID REFERENCES elders(id),
    role TEXT DEFAULT 'secondary' CHECK (role IN ('primary', 'secondary')),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calls table
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES elders (id),
    caregiver_id UUID REFERENCES caregivers(id),
    status TEXT CHECK (status IN ('completed', 'missed', 'retry_1', 'retry_2', 'voicemail', 'initiated')),
    call_sid TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    estimated_cost NUMERIC(10, 4),
    fallback_used BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    latency_ms INTEGER,
    voice_config TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls (id),
    question_id TEXT CHECK (question_id IN ('mood_check', 'med_check', 'sleep_check')),
    transcript_text TEXT,
    confidence_score NUMERIC (3, 2),
    barge_in_detected BOOLEAN DEFAULT false,
    fallback_triggered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Summaries table
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls (id),
    summary_text TEXT,
    summary_type TEXT CHECK (summary_type IN ('template', 'gpt_3.5', 'gpt_4')),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    urgent_flag BOOLEAN DEFAULT false,
    flags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent log
CREATE TABLE consent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID REFERENCES elders(id),
    caregiver_id UUID REFERENCES caregivers(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    consent_revoked_at TIMESTAMP WITH TIME ZONE,
    sample_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate call cost
CREATE OR REPLACE FUNCTION calculate_call_cost(
    duration_seconds INTEGER,
    tier TEXT,
    voice_config TEXT,
    character_count INTEGER DEFAULT 0
) RETURNS NUMERIC AS $$
BEGIN
    RETURN
    -- Twilio cost ($0.014/min)
    CEIL(duration_seconds / 60.0) * 0.014 +
    -- Whisper cost ($0.006/min)
    CEIL(duration_seconds / 60.0) * 0.006 +
    -- GPT cost
    CASE
        WHEN tier = 'silver' THEN 0.002
        WHEN tier = 'gold' THEN 0.020
        ELSE 0
    END +
    -- ElevenLabs cost ($0.30 per 1000 chars)
    CASE
        WHEN voice_config = 'cloned' THEN character_count * 0.0003
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE elders ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_team ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Caregivers can see their own info" ON caregivers FOR SELECT USING (id = auth.uid());

CREATE POLICY "Caregivers see their linked elders" ON elders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM care_team
        WHERE care_team.elder_id = elders.id AND care_team.caregiver_id = auth.uid()
    )
);

CREATE POLICY "Caregivers see their elder calls" ON calls FOR SELECT USING (
    caregiver_id = auth.uid() OR EXISTS (
        SELECT 1 FROM care_team
        WHERE care_team.caregiver_id = auth.uid()
        AND care_team.elder_id = calls.elder_id
    )
);

CREATE POLICY "Caregivers see transcripts" ON transcripts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM calls
        WHERE calls.id = transcripts.call_id AND
        (
            calls.caregiver_id = auth.uid() OR EXISTS (
                SELECT 1 FROM care_team
                WHERE care_team.caregiver_id = auth.uid()
                AND care_team.elder_id = calls.elder_id
            )
        )
    )
);

-- Auto-delete old transcripts after 30 days
CREATE OR REPLACE FUNCTION delete_old_transcripts() RETURNS void AS $$
BEGIN
    DELETE FROM transcripts WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Performance indexes
CREATE INDEX idx_calls_elder_id ON calls (elder_id);
CREATE INDEX idx_calls_caregiver_id ON calls (caregiver_id);
CREATE INDEX idx_calls_created_at ON calls (created_at);
CREATE INDEX idx_calls_status ON calls (status);
CREATE INDEX idx_transcripts_call_id ON transcripts(call_id);
CREATE INDEX idx_summaries_call_id ON summaries (call_id);
CREATE INDEX idx_care_team_caregiver ON care_team(caregiver_id);
CREATE INDEX idx_care_team_elder ON care_team (elder_id);

-- Compound indexes for common queries
CREATE INDEX idx_calls_elder_status ON calls (elder_id, status);
CREATE INDEX idx_calls_date_status ON calls (created_at, status);

-- New policy for service role inserts
CREATE POLICY "Allow service role inserts"
ON public.elders
FOR INSERT
TO service_role
WITH CHECK (
  auth.role() = 'service_role'
); 