import os
from pathlib import Path
from typing import Any, Optional

import pytest
from gltest.direct.loader import deploy_contract


@pytest.fixture
def direct_deploy(direct_vm):
    """Deploy contracts with a stable Direct Mode runner."""

    def _deploy(contract_path: str, *args: Any, sdk_version: Optional[str] = None, **kwargs: Any) -> Any:
        path = Path(contract_path)
        if not path.is_absolute():
            candidate = Path.cwd() / contract_path
            if candidate.exists():
                path = candidate.resolve()

        version = sdk_version or os.environ.get("GENVM_VERSION", "v0.2.16")
        return deploy_contract(path, direct_vm, *args, sdk_version=version, **kwargs)

    return _deploy
