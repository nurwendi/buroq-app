package com.buroq.billing.data.api

import kotlinx.serialization.Serializable

@Serializable
data class CustomerData(
    val id: String? = null,
    val customerId: String,
    val username: String,
    val name: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    val status: String = "active"
)

@Serializable
data class PaymentRequest(
    val username: String,
    val amount: Double,
    val method: String = "cash",
    val notes: String = "",
    val month: Int? = null,
    val year: Int? = null
)

@Serializable
data class PaymentResponse(
    val success: Boolean,
    val payment: PaymentInfo? = null,
    val error: String? = null
)

@Serializable
data class PaymentInfo(
    val id: String,
    val invoiceNumber: String,
    val amount: Double,
    val date: String
)
