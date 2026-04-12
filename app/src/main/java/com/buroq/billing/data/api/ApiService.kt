package com.buroq.billing.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/dashboard/stats")
    suspend fun getDashboardStats(): Response<DashboardStats>

    @GET("api/customer/stats")
    suspend fun getCustomerStats(): Response<CustomerStats>

    @GET("api/customers")
    suspend fun getCustomers(@Query("lite") lite: Boolean = true): Response<Map<String, CustomerData>>

    @POST("api/billing/payments")
    suspend fun submitPayment(@Body request: PaymentRequest): Response<PaymentResponse>

    companion object {
        private const val BASE_URL = "http://13.150.33.187:2000/"
        
        // In a real app, use a proper Provide/Injection pattern. 
        // For initialization, we'll keep it simple.
    }
}
