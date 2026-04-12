package com.buroq.billing.ui.login

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.buroq.billing.data.api.LoginRequest
import com.buroq.billing.data.api.NetworkClient
import com.buroq.billing.data.api.UserData
import kotlinx.coroutines.launch

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val user: UserData) : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

class LoginViewModel : ViewModel() {
    var username by mutableStateOf("")
    var password by mutableStateOf("")
    var uiState: LoginUiState by mutableStateOf(LoginUiState.Idle)
        private set

    fun onUsernameChange(newValue: String) {
        username = newValue
    }

    fun onPasswordChange(newValue: String) {
        password = newValue
    }

    fun login() {
        if (username.isBlank() || password.isBlank()) {
            uiState = LoginUiState.Error("Username dan password tidak boleh kosong")
            return
        }

        viewModelScope.launch {
            uiState = LoginUiState.Loading
            try {
                val response = NetworkClient.apiService.login(
                    LoginRequest(username = username, password = password)
                )
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val userData = response.body()?.user
                    if (userData != null) {
                        uiState = LoginUiState.Success(userData)
                    } else {
                        uiState = LoginUiState.Error("Data user tidak ditemukan")
                    }
                } else {
                    val errorMsg = response.body()?.error ?: "Login Gagal. Silakan coba lagi."
                    uiState = LoginUiState.Error(errorMsg)
                }
            } catch (e: Exception) {
                uiState = LoginUiState.Error("Koneksi gagal: ${e.message}")
            }
        }
    }
    
    fun resetError() {
        if (uiState is LoginUiState.Error) {
            uiState = LoginUiState.Idle
        }
    }
}
