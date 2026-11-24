package com.learnx.service;

import com.learnx.util.JsonHelper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

public class GeminiService {
    private static final GeminiService INSTANCE = new GeminiService();
    public static GeminiService getInstance() { return INSTANCE; }

    private final HttpClient httpClient;
    private final String apiKey;

    private GeminiService() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

        String key = System.getenv("GEMINI_API_KEY");
        if (key == null || key.isEmpty()) {
            key = System.getProperty("GEMINI_API_KEY", "");
        }
        this.apiKey = key;
    }

    public String askGemini(String prompt, String systemPrompt) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.";
        }

        try {
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

            String combinedPrompt = (systemPrompt != null && !systemPrompt.isEmpty())
                ? systemPrompt + "\n\nUser Question:\n" + prompt
                : prompt;

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", combinedPrompt);

            Map<String, Object> contentObj = new HashMap<>();
            contentObj.put("parts", List.of(textPart));

            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("contents", List.of(contentObj));

            String requestJson = JsonHelper.toJson(reqBody);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<String, Object> respMap = JsonHelper.parseObject(response.body());
                @SuppressWarnings("unchecked")
                List<Object> candidates = (List<Object>) respMap.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> firstCandidate = (Map<String, Object>) candidates.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                    if (content != null) {
                        @SuppressWarnings("unchecked")
                        List<Object> parts = (List<Object>) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> firstPart = (Map<String, Object>) parts.get(0);
                            Object text = firstPart.get("text");
                            if (text != null) return text.toString().trim();
                        }
                    }
                }
            } else {
                System.err.println("Gemini API returned status " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Error calling Gemini API from Java: " + e.getMessage());
        }

        return "I am Learn X AI. I am ready to guide your learning and assist with your coursework!";
    }
}
