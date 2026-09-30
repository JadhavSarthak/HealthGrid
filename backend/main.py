"""
HealthGrid Python Backend
Powered by Google Agent Development Kit (ADK) & Google Gemini on Vertex AI.
"""
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from .agents.prediction_agent import PredictionAgent
from .agents.optimization_agent import OptimizationAgent
from .agents.simulation_agent import SimulationAgent
from .agents.briefing_agent import BriefingAgent
from .agents.digitization_agent import DigitizationAgent
from .agents.governance_coordinator import GovernanceCoordinator

app = FastAPI(
    title="HealthGrid ADK Backend",
    description="Python backend running Google Agent Development Kit (ADK) and Vertex AI services for India PHC supply resilience.",
    version="2.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ADK Agents
prediction_agent = PredictionAgent()
optimization_agent = OptimizationAgent()
simulation_agent = SimulationAgent()
briefing_agent = BriefingAgent()
digitization_agent = DigitizationAgent()
governance_coordinator = GovernanceCoordinator()

# Pydantic schemas
class PredictRequest(BaseModel):
    phcs: List[Dict[str, Any]]
    surge_active: bool = False

class OptimizeRequest(BaseModel):
    source_depots: List[Dict[str, Any]]
    recipient_district: str
    medicine_id: str
    deficit_units: int = 1200

class SimulateRequest(BaseModel):
    transfer_quantity: int = 1200
    base_eta_hours: float = 7.2
    recipient_cluster_drain_rate: float = 210.0
    recipient_current_buffer_hours: float = 42.5

class BriefingRequest(BaseModel):
    district: str = "Chandrapur"
    affected_count: int = 11
    stockout_probability_percent: float = 78.3
    hours_to_stockout: float = 42.5
    source_depot: str = "Wardha Regional Warehouse"
    transfer_quantity: int = 1200
    unit: str = "bottles (IV Normal Saline 500ml)"
    donor_buffer_remaining_days: float = 18.5
    language: str = "en"

class OcrRequest(BaseModel):
    image_data_url: Optional[str] = None

class SignoffRequest(BaseModel):
    transfer_id: str
    officer_id: str
    source_depot: str
    target_district: str
    quantity: int
    donor_remaining_buffer_days: float
    notes: str = ""

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "framework": "Google Agent Development Kit (ADK) on Python 3.11",
        "ai_model": "gemini-2.5-flash on Vertex AI",
        "active_agents": [
            prediction_agent.name,
            optimization_agent.name,
            simulation_agent.name,
            briefing_agent.name,
            digitization_agent.name,
            governance_coordinator.name
        ]
    }

@app.get("/api/agents")
def list_agents():
    return {
        "agents": [
            {
                "name": agent.name,
                "role": agent.role,
                "description": agent.description,
                "tools": agent.get_tool_definitions()
            }
            for agent in [
                prediction_agent,
                optimization_agent,
                simulation_agent,
                briefing_agent,
                digitization_agent,
                governance_coordinator
            ]
        ]
    }

@app.post("/api/agents/predict")
def run_prediction(req: PredictRequest):
    return {
        "agent": prediction_agent.name,
        "evaluations": prediction_agent.evaluate_phc_cluster(req.phcs, req.surge_active)
    }

@app.post("/api/agents/optimize")
def run_optimization(req: OptimizeRequest):
    from .agents.optimization_agent import solve_redistribution_plan
    result = solve_redistribution_plan(
        source_depots=req.source_depots,
        recipient_district=req.recipient_district,
        medicine_id=req.medicine_id,
        deficit_units=req.deficit_units
    )
    return {
        "agent": optimization_agent.name,
        **result
    }

@app.post("/api/agents/simulate")
def run_simulation(req: SimulateRequest):
    from .agents.simulation_agent import run_counterfactual_stress_test
    result = run_counterfactual_stress_test(
        transfer_quantity=req.transfer_quantity,
        base_eta_hours=req.base_eta_hours,
        recipient_cluster_drain_rate=req.recipient_cluster_drain_rate,
        recipient_current_buffer_hours=req.recipient_current_buffer_hours
    )
    return {
        "agent": simulation_agent.name,
        **result
    }

@app.post("/api/agents/briefing")
def run_briefing(req: BriefingRequest):
    result = briefing_agent.generate_briefing(req.dict())
    return {
        "agent": briefing_agent.name,
        **result
    }

@app.post("/api/agents/ocr")
def run_digitization(req: OcrRequest):
    entries = digitization_agent.digitize_register(req.image_data_url)
    return {
        "agent": digitization_agent.name,
        "extracted_rows": entries
    }

@app.post("/api/agents/governance/signoff")
def run_signoff(req: SignoffRequest):
    result = governance_coordinator.verify_and_authorize_transfer(
        transfer_id=req.transfer_id,
        officer_id=req.officer_id,
        source_depot=req.source_depot,
        target_district=req.target_district,
        quantity=req.quantity,
        donor_remaining_buffer_days=req.donor_remaining_buffer_days,
        notes=req.notes
    )
    if not result.get("authorized"):
        raise HTTPException(status_code=403, detail=result.get("error"))
    return {
        "agent": governance_coordinator.name,
        **result
    }
