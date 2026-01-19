package com.insurai.insurai_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class InsuraiBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(InsuraiBackendApplication.class, args);
	}
}

// Add a simple REST controller inside the same file or a new file

@RestController
class HelloController {

	@GetMapping("/hello")
	public String hello() {
		return "Hello World from InsurAI!";
	}
}
