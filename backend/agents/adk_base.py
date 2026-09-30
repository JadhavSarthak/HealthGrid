"""
Google Agent Development Kit (ADK) Base Framework for HealthGrid
Section 35.2 Invariant: Agents possess read, simulate, and formulate capabilities only.
Zero write authority to physical logistics or financial ledgers without human cryptographic sign-off.
"""
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
import json

@dataclass
class Tool:
    name: str
    description: str
    parameters: Dict[str, Any]
    func: Callable[..., Any]

    def execute(self, **kwargs) -> Any:
        return self.func(**kwargs)

@dataclass
class ADKAgent:
    name: str
    role: str
    description: str
    system_instruction: str
    tools: List[Tool] = field(default_factory=list)

    def register_tool(self, tool: Tool):
        self.tools.append(tool)

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters
            }
            for t in self.tools
        ]
