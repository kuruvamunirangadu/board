# VisiOS Beta Launch & Real-Student Validation Guide

## 1. Study Overview & Goals
The VisiOS Pilot Beta is an exploratory usability and learning effectiveness study evaluating whether interactive spatial visual representations and real-time physical simulations produce measurable conceptual understanding gains for secondary and undergraduate STEM students.

---

## 2. Participant Eligibility & Safeguards
- **Target Pilot Cohort**: 5 to 15 STEM students (Physics, Computer Science, or Engineering).
- **Minimum Requirements**: Laptop or desktop browser (Chrome, Firefox, Safari, Edge) with WebGL support.
- **Privacy Standard**: Zero Personally Identifiable Information (PII) collected. Each participant is assigned a random pseudonymous identifier ($P\text{-}XXX$).
- **Voluntary Consent**: Participants must review and accept the skippable informed consent modal at `/beta`. Participants can exercise their right to erasure at any point via the deletion portal.

---

## 3. Curated Beta Topics & Protocol

| Study Task | Topic | Subject | Target Duration | Learning Goal |
| :--- | :--- | :--- | :--- | :--- |
| **Task 1** | Nonlinear Pendulum Dynamics | Physics | ~12 mins | Understand departure from $T = 2\pi\sqrt{L/g}$ at large initial angles and phase space damping spirals. |
| **Task 2** | Binary Search Trees | Computer Science | ~10 mins | Contrast $O(\log n)$ balanced tree traversal with $O(n)$ degenerate linked list chains. |
| **Task 3** | RLC Circuit Resonance | Electronics | ~10 mins | Analyze impedance cancellation $Z = R$ at natural resonant frequency $\omega_0 = 1/\sqrt{LC}$. |

---

## 4. Step-by-Step Testing Runbook

1. **Step 1 — Informed Consent**: Navigate to `/beta` and confirm voluntary participation and age confirmation. Note your participant code (e.g. `P-101`).
2. **Step 2 — Baseline Pre-Test**: Answer 3 conceptual multiple-choice questions assessing initial intuitive grasp.
3. **Step 3 — Interactive Visual Exploration**:
   - For Physics: Adjust initial angle beyond 45° to compare nonlinear periods; modify damping slider $\gamma$ to watch phase space limit cycles.
   - For CS: Step through balanced vs sorted insertion sequences.
   - For Electronics: Tune input frequency across $\omega_0$ to observe current peak and zero phase shift.
4. **Step 4 — Conceptual Post-Test**: Complete the 3-question post-test to evaluate learning gain delta ($\Delta = \text{Post} - \text{Pre}$).
5. **Step 5 — Usability Review**: Submit 1-minute qualitative feedback on what helped most, confusing aspects, 1-to-5 star rating, and bug reports.

---

## 5. Right-to-Erasure Procedure (GDPR / Research Ethics)
If any participant requests removal of their trial data:
1. Open the **Researcher Evaluation Dashboard** at `/beta`.
2. Scroll to the **Participant Data Deletion Compliance** section.
3. Enter the participant code (e.g. `P-101`) and click **Purge Participant Records**.
4. The system immediately wipes all associated session logs, assessment scores, and feedback entries.

