package com.buroq.billing.ui.dashboard

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.buroq.billing.data.api.DashboardStats
import com.buroq.billing.data.api.CustomerStats
import com.buroq.billing.data.api.NetworkClient
import kotlinx.coroutines.launch

sealed class DashboardUiState {
    object Loading : DashboardUiState()
    data class AdminSuccess(val stats: DashboardStats) : DashboardUiState()
    data class CustomerSuccess(val stats: CustomerStats) : DashboardUiState()
    data class Error(val message: String) : DashboardUiState()
}

class DashboardViewModel : ViewModel() {
    var uiState: DashboardUiState by mutableStateOf(DashboardUiState.Loading)
        private set

    fun loadStats(role: String) {
        viewModelScope.launch {
            uiState = DashboardUiState.Loading
            try {
                if (role == "customer") {
                    val response = NetworkClient.apiService.getCustomerStats()
                    if (response.isSuccessful) {
                        uiState = DashboardUiState.CustomerSuccess(response.body() ?: CustomerStats())
                    } else {
                        uiState = DashboardUiState.Error("Gagal mengambil data pelanggan")
                    }
                } else {
                    val response = NetworkClient.apiService.getDashboardStats()
                    if (response.isSuccessful) {
                        uiState = DashboardUiState.AdminSuccess(response.body() ?: DashboardStats())
                    } else {
                        uiState = DashboardUiState.Error("Gagal mengambil data dashboard")
                    }
                }
            } catch (e: Exception) {
                uiState = DashboardUiState.Error("Koneksi gagal: ${e.message}")
            }
        }
    }
}
