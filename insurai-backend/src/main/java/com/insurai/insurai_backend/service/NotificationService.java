package com.insurai.insurai_backend.service;

import java.time.format.DateTimeFormatter;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Claim;
import com.insurai.insurai_backend.model.EmployeeQuery;
import com.insurai.insurai_backend.model.Hr;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class NotificationService {

    private final JavaMailSender mailSender;

    public NotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // 🔹 Common Date Format (12-hour format with AM/PM)
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a");

    
    // ========================= Claim Notifications =========================

    public void sendClaimStatusEmail(String to, Claim claim) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("InsurAi: Claim #" + claim.getId() + " " + claim.getStatus());

            String statusColor = "Approved".equalsIgnoreCase(claim.getStatus()) ? "#28a745" : "#dc3545";
            String claimDateStr = claim.getClaimDate() != null ? claim.getClaimDate().format(FORMATTER) : "N/A";
            String hrName = (claim.getAssignedHr() != null && claim.getAssignedHr().getName() != null)
                    ? claim.getAssignedHr().getName() : "Not yet assigned";

            String content = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
                    "<style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    ".header { background-color: #0d6efd; color: white; padding: 15px; text-align: center; }" +
                    ".content { margin: 20px; }" +
                    ".footer { margin: 20px; font-size: 0.85em; color: gray; }" +
                    ".claim-details { border-collapse: collapse; width: 100%; margin-top: 15px; }" +
                    ".claim-details td, .claim-details th { border: 1px solid #ddd; padding: 8px; }" +
                    ".claim-details th { background-color: #f2f2f2; text-align: left; }" +
                    ".status { font-weight: bold; color: " + statusColor + "; }" +
                    "</style></head><body>" +
                    "<div class='header'><h2>InsurAi Notification</h2></div>" +
                    "<div class='content'>" +
                    "<p>Dear " + (claim.getEmployee() != null ? claim.getEmployee().getName() : "Employee") + ",</p>" +
                    "<p>Your claim has been <span class='status'>" + claim.getStatus() + "</span>.</p>" +
                    "<table class='claim-details'>" +
                    "<tr><th>Claim ID</th><td>" + claim.getId() + "</td></tr>" +
                    "<tr><th>Type</th><td>" + claim.getTitle() + "</td></tr>" +
                    "<tr><th>Policy</th><td>" + (claim.getPolicy() != null ? claim.getPolicy().getPolicyName() : "N/A") + "</td></tr>" +
                    "<tr><th>Amount</th><td>₹" + claim.getAmount() + "</td></tr>" +
                    "<tr><th>Claim Date</th><td>" + claimDateStr + "</td></tr>" +
                    "<tr><th>Assigned HR</th><td>" + hrName + "</td></tr>";

            if (claim.getRemarks() != null && !claim.getRemarks().isEmpty()) {
                content += "<tr><th>Remarks</th><td>" + claim.getRemarks() + "</td></tr>";
            }

            content += "</table><p>Thank you for using <strong>InsurAi</strong>.</p>" +
                    "</div><div class='footer'>This is an automated message. Please do not reply.</div>" +
                    "</body></html>";

            helper.setText(content, true);
            mailSender.send(mimeMessage);
            System.out.println("✅ Claim status email sent to Employee: " + to + " (Claim #" + claim.getId() + ")");
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send claim status email (Claim #" + claim.getId() + "): " + e.getMessage());
        }
    }

    public void sendNewClaimAssignedToHr(String to, Hr hr, Claim claim) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("InsurAi: New Claim Assigned - #" + claim.getId());

            String claimDateStr = claim.getClaimDate() != null ? claim.getClaimDate().format(FORMATTER) : "N/A";

            String content = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
                    "<style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    ".header { background-color: #198754; color: white; padding: 15px; text-align: center; }" +
                    ".content { margin: 20px; }" +
                    ".footer { margin: 20px; font-size: 0.85em; color: gray; }" +
                    ".claim-details { border-collapse: collapse; width: 100%; margin-top: 15px; }" +
                    ".claim-details td, .claim-details th { border: 1px solid #ddd; padding: 8px; }" +
                    ".claim-details th { background-color: #f2f2f2; text-align: left; }" +
                    "</style></head><body>" +
                    "<div class='header'><h2>New Claim Assigned</h2></div>" +
                    "<div class='content'>" +
                    "<p>Dear " + (hr != null ? hr.getName() : "HR") + ",</p>" +
                    "<p>A new claim has been assigned to you for review:</p>" +
                    "<table class='claim-details'>" +
                    "<tr><th>Claim ID</th><td>" + claim.getId() + "</td></tr>" +
                    "<tr><th>Employee</th><td>" + (claim.getEmployee() != null ? claim.getEmployee().getName() : "N/A") + "</td></tr>" +
                    "<tr><th>Type</th><td>" + claim.getTitle() + "</td></tr>" +
                    "<tr><th>Amount</th><td>₹" + claim.getAmount() + "</td></tr>" +
                    "<tr><th>Claim Date</th><td>" + claimDateStr + "</td></tr>" +
                    "</table>" +
                    "<p>Please login to <strong>InsurAi HR Dashboard</strong> to take action.</p>" +
                    "</div><div class='footer'>This is an automated message. Please do not reply.</div>" +
                    "</body></html>";

            helper.setText(content, true);
            mailSender.send(mimeMessage);
            System.out.println("✅ New claim assignment email sent to HR: " + to + " (Claim #" + claim.getId() + ")");
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send HR new claim notification (Claim #" + claim.getId() + "): " + e.getMessage());
        }
    }

    // ========================= Employee-Agent Query Notifications =========================

    public void sendEmployeeQueryNotificationToAgent(String to, EmployeeQuery query) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("InsurAi: New Query from Employee #" + (query.getEmployee() != null ? query.getEmployee().getId() : ""));

            String content = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
                    "<style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    ".header { background-color: #ff8800; color: white; padding: 15px; text-align: center; }" +
                    ".content { margin: 20px; }" +
                    ".footer { margin: 20px; font-size: 0.85em; color: gray; }" +
                    ".query-details { border-collapse: collapse; width: 100%; margin-top: 15px; }" +
                    ".query-details td, .query-details th { border: 1px solid #ddd; padding: 8px; }" +
                    ".query-details th { background-color: #f2f2f2; text-align: left; }" +
                    "</style></head><body>" +
                    "<div class='header'><h2>New Employee Query</h2></div>" +
                    "<div class='content'>" +
                    "<p>Dear Agent,</p>" +
                    "<p>A new query has been submitted by " + (query.getEmployee() != null ? query.getEmployee().getName() : "Employee") + ".</p>" +
                    "<table class='query-details'>" +
                    "<tr><th>Query ID</th><td>" + query.getId() + "</td></tr>" +
                    "<tr><th>Query Text</th><td>" + query.getQueryText() + "</td></tr>" +
                    "<tr><th>Policy</th><td>" + query.getPolicyName() + "</td></tr>" +
                    "<tr><th>Claim Type</th><td>" + query.getClaimType() + "</td></tr>" +
                    "</table>" +
                    "<p>Please login to <strong>InsurAi Agent Dashboard</strong> to respond.</p>" +
                    "</div><div class='footer'>This is an automated message. Please do not reply.</div>" +
                    "</body></html>";

            helper.setText(content, true);
            mailSender.send(mimeMessage);

            System.out.println("✅ New query notification sent to Agent: " + to + " (Query #" + query.getId() + ")");
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send new query notification to agent (Query #" + query.getId() + "): " + e.getMessage());
        }
    }

    // 🔹 NEW: Agent response notification to Employee
    public void sendAgentResponseNotificationToEmployee(String to, EmployeeQuery query) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("InsurAi: Response to Your Query #" + query.getId());

            String content = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
                    "<style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    ".header { background-color: #007bff; color: white; padding: 15px; text-align: center; }" +
                    ".content { margin: 20px; }" +
                    ".footer { margin: 20px; font-size: 0.85em; color: gray; }" +
                    ".query-details { border-collapse: collapse; width: 100%; margin-top: 15px; }" +
                    ".query-details td, .query-details th { border: 1px solid #ddd; padding: 8px; }" +
                    ".query-details th { background-color: #f2f2f2; text-align: left; }" +
                    "</style></head><body>" +
                    "<div class='header'><h2>Query Response</h2></div>" +
                    "<div class='content'>" +
                    "<p>Dear Employee,</p>" +
                    "<p>Your query has been responded by the assigned agent.</p>" +
                    "<table class='query-details'>" +
                    "<tr><th>Query ID</th><td>" + query.getId() + "</td></tr>" +
                    "<tr><th>Query Text</th><td>" + query.getQueryText() + "</td></tr>" +
                    "<tr><th>Response</th><td>" + query.getResponse() + "</td></tr>" +
                    "<tr><th>Policy</th><td>" + query.getPolicyName() + "</td></tr>" +
                    "<tr><th>Claim Type</th><td>" + query.getClaimType() + "</td></tr>" +
                    "</table>" +
                    "<p>Please login to <strong>InsurAi Employee Dashboard</strong> to view details.</p>" +
                    "</div><div class='footer'>This is an automated message. Please do not reply.</div>" +
                    "</body></html>";

            helper.setText(content, true);
            mailSender.send(mimeMessage);

            System.out.println("✅ Agent response notification sent to Employee: " + to + " (Query #" + query.getId() + ")");
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send agent response notification to employee (Query #" + query.getId() + "): " + e.getMessage());
        }
    }

    // 🔹 Future Expansion
    // public void sendPendingClaimReminder(Hr hr, Claim claim) { ... }
    // public void sendFraudAlert(String to, Claim claim) { ... }
    // public void sendScheduledReport(String to, byte[] reportFile) { ... }
}
