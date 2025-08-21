-- Database: icn_platform - Initial Schema
-- Version: 1.0.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS cooperatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    cooperative_type VARCHAR(50) NOT NULL CHECK (cooperative_type IN (
        'worker', 'consumer', 'housing', 'agricultural', 'credit_union', 
        'platform', 'multi_stakeholder', 'solidarity'
    )),
    governance_model VARCHAR(50) NOT NULL CHECK (governance_model IN (
        'consensus', 'consensus_minus_one', 'majority', 'supermajority', 
        'sociocratic_circles', 'delegated_democracy'
    )),
    economic_model VARCHAR(50) NOT NULL CHECK (economic_model IN (
        'surplus_sharing', 'time_banking', 'patronage_dividends', 
        'equal_distribution', 'contribution_based'
    )),
    member_count INTEGER DEFAULT 0,
    founding_date DATE NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    website_url VARCHAR(500),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'active', 'suspended', 'inactive'
    )),
    federation_level VARCHAR(20) DEFAULT 'observer' CHECK (federation_level IN (
        'observer', 'associate', 'full_member', 'founding_member'
    )),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id VARCHAR(255) UNIQUE NOT NULL,
    home_cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
    membership_status VARCHAR(20) DEFAULT 'active' CHECK (membership_status IN (
        'pending', 'active', 'suspended', 'inactive', 'terminated'
    )),
    skills JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    governance_roles JSONB DEFAULT '[]',
    network_permissions JSONB DEFAULT '[]',
    reputation_score DECIMAL(3,2) DEFAULT 0.0 CHECK (reputation_score >= 0.0 AND reputation_score <= 5.0),
    bio TEXT,
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS economic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    sequence_number BIGSERIAL,
    event_version INTEGER DEFAULT 1,
    initiator_id UUID NOT NULL REFERENCES members(id),
    participants JSONB NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    governance_status VARCHAR(50) DEFAULT 'pending' CHECK (governance_status IN (
        'pending', 'auto_approved', 'voting_in_progress', 
        'approved', 'rejected', 'expired'
    )),
    governance_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(aggregate_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    proposal_type VARCHAR(50) NOT NULL CHECK (proposal_type IN (
        'economic', 'policy', 'membership', 'infrastructure', 
        'constitutional', 'operational'
    )),
    initiator_id UUID NOT NULL REFERENCES members(id),
    related_event_id UUID REFERENCES economic_events(id),
    stakeholder_cooperatives JSONB NOT NULL,
    voting_rules JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'voting', 'objection_resolution', 
        'approved', 'rejected', 'withdrawn', 'expired'
    )),
    voting_deadline TIMESTAMP WITH TIME ZONE,
    discussion_period_end TIMESTAMP WITH TIME ZONE,
    amendments JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES members(id),
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN (
        'approve', 'reject', 'abstain', 'delegate', 'object'
    )),
    vote_weight DECIMAL(10,4) DEFAULT 1.0,
    reasoning TEXT,
    is_final BOOLEAN DEFAULT true,
    delegate_to UUID REFERENCES members(id),
    metadata JSONB DEFAULT '{}',
    cast_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

CREATE TABLE IF NOT EXISTS shared_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
        'physical_asset', 'digital_tool', 'skill_service', 'space', 
        'equipment', 'vehicle', 'facility', 'knowledge'
    )),
    owner_cooperative_id UUID NOT NULL REFERENCES cooperatives(id),
    manager_member_id UUID REFERENCES members(id),
    location JSONB,
    specifications JSONB DEFAULT '{}',
    availability_schedule JSONB NOT NULL,
    access_model VARCHAR(50) NOT NULL CHECK (access_model IN (
        'free_for_members', 'cost_sharing', 'time_banking', 
        'barter_exchange', 'rental_fee', 'contribution_based'
    )),
    cost_model JSONB DEFAULT '{}',
    requirements JSONB DEFAULT '[]',
    booking_rules JSONB DEFAULT '{}',
    images JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN (
        'available', 'unavailable', 'maintenance', 'retired'
    )),
    usage_stats JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES shared_resources(id),
    requester_id UUID NOT NULL REFERENCES members(id),
    requesting_cooperative_id UUID NOT NULL REFERENCES cooperatives(id),
    booking_start TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_end TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'active', 'completed', 'cancelled', 'rejected'
    )),
    approval_required BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES members(id),
    cost_calculation JSONB DEFAULT '{}',
    usage_log JSONB DEFAULT '[]',
    feedback JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (booking_end > booking_start)
);

CREATE TABLE IF NOT EXISTS trust_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trustor_cooperative_id UUID NOT NULL REFERENCES cooperatives(id),
    trustee_cooperative_id UUID NOT NULL REFERENCES cooperatives(id),
    trust_level DECIMAL(3,2) NOT NULL CHECK (trust_level >= 0.0 AND trust_level <= 1.0),
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
        'trading_partner', 'resource_sharing', 'knowledge_exchange', 
        'financial_collaboration', 'strategic_alliance'
    )),
    established_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
    interaction_count INTEGER DEFAULT 0,
    successful_interactions INTEGER DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE(trustor_cooperative_id, trustee_cooperative_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES members(id),
    actor_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooperatives_domain ON cooperatives(domain);
CREATE INDEX IF NOT EXISTS idx_cooperatives_status ON cooperatives(status);
CREATE INDEX IF NOT EXISTS idx_members_cooperative ON members(home_cooperative_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_events_aggregate ON economic_events(aggregate_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_events_type ON economic_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON economic_events(governance_status);
CREATE INDEX IF NOT EXISTS idx_events_created ON economic_events(created_at);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_deadline ON proposals(voting_deadline);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_resources_owner ON shared_resources(owner_cooperative_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON shared_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_bookings_resource ON resource_bookings(resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON resource_bookings(booking_start, booking_end);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cooperatives_updated_at BEFORE UPDATE ON cooperatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON shared_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON resource_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


