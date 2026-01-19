package com.insurai.insurai_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.insurai.insurai_backend.model.Claim;
import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.model.Hr;
import com.insurai.insurai_backend.model.Policy;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    // Get all claims submitted by a specific employee
    List<Claim> findByEmployee(Employee employee);

    // Get all claims submitted by employee's corporate ID
    List<Claim> findByEmployee_EmployeeId(String employeeId);

    // Get all claims for a specific policy
    List<Claim> findByPolicy(Policy policy);

    // Get all claims by status (Pending, Approved, Rejected)
    List<Claim> findByStatus(String status);

    // Get all claims of a specific employee with a specific status
    List<Claim> findByEmployeeAndStatus(Employee employee, String status);

    // Get all claims of a specific employee by corporate ID and status
    List<Claim> findByEmployee_EmployeeIdAndStatus(String employeeId, String status);

    // Get all claims assigned to a specific HR
    List<Claim> findByAssignedHrId(Long hrId);

    // Count pending claims for a specific HR
    int countByAssignedHrAndStatus(Hr hr, String status);

    // -------------------- New: fetch claim by ID with employee eagerly --------------------
    @Query("SELECT c FROM Claim c JOIN FETCH c.employee WHERE c.id = :claimId")
    Optional<Claim> findByIdWithEmployee(@Param("claimId") Long claimId);

    // Optional: fetch all claims with HR info (if needed for admin dashboards)
    @Query("SELECT c FROM Claim c LEFT JOIN FETCH c.assignedHr")
    List<Claim> findAllWithHrDetails();

    List<Claim> findByAssignedHrIdAndFraudFlag(Long hrId, boolean fraudFlag);

}

