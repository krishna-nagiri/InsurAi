package com.insurai.insurai_backend.service;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class SupabaseStorageService {

    @Value("${supabase.url}")
    private String supabaseUrl; //

    @Value("${supabase.accessKey}")
    private String accessKey;

    @Value("${supabase.secretKey}")
    private String secretKey;

    @Value("${supabase.bucket}")
    private String bucketName;

    @Value("${supabase.region:ap-south-1}")
    private String region;

    private S3Client s3Client;

    private void initS3Client() {
        if (s3Client == null) {
            s3Client = S3Client.builder()
                    .endpointOverride(java.net.URI.create(supabaseUrl))
                    .credentialsProvider(
                            StaticCredentialsProvider.create(
                                    AwsBasicCredentials.create(accessKey, secretKey)
                            )
                    )
                    .region(Region.of(region))
                    .build();
        }
    }

    public String uploadFile(MultipartFile file, String path) {
        initS3Client();

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or null");
        }

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(path)
                    .acl("public-read") // optional: make file public
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));

            // Construct public URL
            return String.format("%s/%s/%s", supabaseUrl, bucketName, path);

        } catch (IOException e) {
            throw new RuntimeException("Error reading file: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }
}
