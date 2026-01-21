from httpx import AsyncClient
import pytest

from chat_server.api.models import UserCreate
from chat_server.connection.channel import Channel
from chat_server.db import crud

API_URL = "/api/v1/dashboard/channels"


class TestActiveChannels:
    """
    Tests for Active Channels API Endpoint
    """

    @pytest.mark.asyncio
    async def test_active_channel_success(
        self,
        test_client: AsyncClient,
        test_session,
        auth_headers,
        mock_dashboard_service,
    ):
        # The database can't be empty otherwise the auth_headers won't work
        await crud.create_user(
            test_session, UserCreate(username="testuser", password="Password1")
        )
        # Mock Return Values
        mock_dashboard_service.get_active_channels.return_value = [
            Channel(id=1, name="test1"),
            Channel(id=2, name="test2"),
        ]

        response = await test_client.get(f"{API_URL}/active", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert len(data["channels"]) == 2
        assert data["channels"][0]["id"] == 1

    @pytest.mark.asyncio
    async def test_active_channel_empty(
        self,
        test_client: AsyncClient,
        test_session,
        auth_headers,
        mock_dashboard_service,
    ):
        # The database can't be empty otherwise the auth_headers won't work
        await crud.create_user(
            test_session, UserCreate(username="testuser", password="Password1")
        )
        # Mock Return Values
        mock_dashboard_service.get_active_channels.return_value = []

        response = await test_client.get(f"{API_URL}/active", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert len(data["channels"]) == 0

    @pytest.mark.asyncio
    async def test_active_channel_unauthorized(
        self,
        test_client: AsyncClient,
        mock_dashboard_service,
    ):
        """
        401 is expected when no authorization is provided
        """
        # Mock Return Values
        mock_dashboard_service.get_active_channels.return_value = []

        response = await test_client.get(f"{API_URL}/active")

        assert response.status_code == 401
