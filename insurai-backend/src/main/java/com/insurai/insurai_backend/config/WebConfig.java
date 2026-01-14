package com.insurai.insurai_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Absolute path to your uploads folder
    private static final String UPLOAD_DIR = "C:\\Users\\Krishna Nagiri\\Downloads\\InsurAI\\InsurAI-Corporate-Policy-Automation-and-Intelligence-System-main\\InsurAi\\insurai-backend\\uploads";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve /uploads/** URLs from the local folder
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:///" + UPLOAD_DIR) // Ensure triple slash
                .setCachePeriod(0) // Disable caching for development
                .resourceChain(true);
    }
}
