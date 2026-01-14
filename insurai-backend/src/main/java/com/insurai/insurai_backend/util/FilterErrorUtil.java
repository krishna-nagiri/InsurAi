package com.insurai.insurai_backend.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class FilterErrorUtil {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static void writeError(HttpServletResponse response,
                                  int status,
                                  String error,
                                  String message) throws IOException {

        response.setStatus(status);
        response.setContentType("application/json");

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);

        response.getWriter().write(mapper.writeValueAsString(body));
    }
}
