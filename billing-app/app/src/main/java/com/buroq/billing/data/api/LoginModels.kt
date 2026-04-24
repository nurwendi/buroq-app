package com.buroq.billing.data.api

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val username: String,
    val username_type: String = "customer", // Default to customer as per backend observation or user preference
    val password: String
)

@Serializable
data class LoginResponse(
    val success: Boolean,
    val user: UserData? = null,
    val token: String? = null,
    val error: String? = null
)

@Serializable
data class UserData(
    val id: String,
    val username: String,
    val role: String,
    val ownerId: String? = null,
    val fullName: String? = null
)
