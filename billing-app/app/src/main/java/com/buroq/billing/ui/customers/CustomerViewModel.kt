package com.buroq.billing.ui.customers

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.buroq.billing.data.api.CustomerData
import com.buroq.billing.data.api.NetworkClient
import com.buroq.billing.data.api.PaymentRequest
import kotlinx.coroutines.launch

sealed class CustomerUiState {
    object Loading : CustomerUiState()
    data class Success(val customers: List<CustomerData>) : CustomerUiState()
    data class Error(val message: String) : CustomerUiState()
}

class CustomerViewModel : ViewModel() {
    var uiState: CustomerUiState by mutableStateOf(CustomerUiState.Loading)
        private set
    
    var searchQuery by mutableStateOf("")
    private var allCustomers: List<CustomerData> = emptyList()

    fun loadCustomers() {
        viewModelScope.launch {
            uiState = CustomerUiState.Loading
            try {
                val response = NetworkClient.apiService.getCustomers()
                if (response.isSuccessful) {
                    allCustomers = response.body()?.values?.toList() ?: emptyList()
                    filterCustomers()
                } else {
                    uiState = CustomerUiState.Error("Gagal mengambil daftar pelanggan")
                }
            } catch (e: Exception) {
                uiState = CustomerUiState.Error("Koneksi gagal: ${e.message}")
            }
        }
    }

    fun onSearchQueryChange(newQuery: String) {
        searchQuery = newQuery
        filterCustomers()
    }

    private fun filterCustomers() {
        val filtered = if (searchQuery.isBlank()) {
            allCustomers
        } else {
            allCustomers.filter { 
                it.name.contains(searchQuery, ignoreCase = true) || 
                it.customerId.contains(searchQuery, ignoreCase = true) ||
                it.username.contains(searchQuery, ignoreCase = true)
            }
        }
        uiState = CustomerUiState.Success(filtered)
    }

    fun processPayment(username: String, amount: Double, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            try {
                val response = NetworkClient.apiService.submitPayment(
                    PaymentRequest(username = username, amount = amount)
                )
                if (response.isSuccessful && response.body()?.success == true) {
                    onResult(true, null)
                } else {
                    onResult(false, response.body()?.error ?: "Pembayaran gagal")
                }
            } catch (e: Exception) {
                onResult(false, "Koneksi gagal: ${e.message}")
            }
        }
    }
}
