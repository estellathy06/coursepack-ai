<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

# AGENTS.md

## Project Goal

Build an AI-powered university exam prediction and study planning platform.

The platform helps students upload course materials, extract reusable course intelligence, predict likely exam topics, and generate personalized study plans based on their target score, available study time, and exam deadline.

The system must be optimized for low token usage, deterministic outputs, reusable course profiles, and scalable multi-user access.

---

## Core Product Logic

The system should support course-level shared intelligence.

If at least one student in a semester uploads the complete course materials for a specific course, including lecture slides, quizzes, midterm practice materials, final exam practice materials, and past exams, other students in the same course should not be required to upload the same documents again.

Instead, the system should process the uploaded materials once, extract structured course intelligence, store it in the database, and reuse it for future users in the same course.

The system should avoid reprocessing the same documents unless new files are uploaded or the course profile becomes outdated.

---

## Key User Flow

1. A student selects or creates a course.
2. The student uploads course materials if no existing course profile exists.
3. The system checks whether the uploaded files are duplicates using document hashes.
4. If the documents are new, the system processes them once.
5. The system extracts topics, question types, historical patterns, practice exam gaps, and probability scores.
6. The system stores this extracted information as a compressed course prediction profile.
7. Future students in the same course reuse the existing course profile.
8. When a student requests an exam prediction or study plan, the system uses the stored course profile instead of re-reading all documents.
9. If the same variables are submitted again, the system returns the exact same cached output.

---

## Token Optimization Requirements

The system must minimize AI token usage.

Do not send full PDFs, slides, quizzes, or exams to the AI model every time a student asks a question.

Full document analysis should only happen during the initial ingestion stage or when new materials are uploaded.

For regular prediction and study plan requests, the system should only send compressed structured data to the AI model, including:

* course profile summary
* topic list
* topic coverage scores
* historical exam frequency
* multiple-choice topic distribution
* long-answer topic distribution
* practice exam gaps
* student target score
* days remaining
* available study time
* exam type

The system should reuse stored course intelligence whenever possible.

---

## Document Deduplication

Every uploaded document must be hashed before processing.

Use a stable file hash such as SHA-256.

If a document with the same hash already exists in the database, do not reprocess it.

Instead, link the existing processed document data to the current course or user where appropriate.

Duplicate uploads should not trigger a new AI model call.

---

## Course Profile Generation

When new course materials are uploaded, the system should extract and store a structured course prediction profile.

The course profile should include:

* course_id
* school
* course_code
* semester
* professor, if available
* exam_type
* uploaded_material_version
* prediction_profile_version
* topics_covered
* topic_coverage_scores
* quiz_topic_distribution
* midterm_practice_topic_distribution
* final_practice_topic_distribution
* historical_exam_topic_distribution
* multiple_choice_topic_distribution
* long_answer_topic_distribution
* practice_exam_gaps
* high_probability_topics
* low_probability_topics
* recommended_study_priority
* last_processed_at

The course profile should be stored in a structured format, preferably JSONB in Supabase.

---

## Exam Prediction Logic

The exam prediction system should use two prediction methods.

### Method 1: Historical Probability Prediction

The system should analyze past exams and calculate which topics have appeared most consistently over the past few years.

It should separately calculate topic frequency for:

* multiple-choice questions
* short-answer questions
* long-answer questions
* calculation questions
* proof-based questions
* essay or explanation questions, if applicable

Topics that appear repeatedly across historical exams should receive higher probability scores.

### Method 2: Practice Exam Gap Prediction

The system should compare topics covered in the semester against topics included in practice exams.

If a topic was taught in the semester but does not appear in the practice exam, the system should mark it as a potential gap.

These gap topics may have a higher probability of appearing on the real exam because instructors may choose questions that were not directly included in the practice materials.

The system should calculate a gap risk score for each topic.

---

## Prediction Score Formula

Create a combined prediction score for each topic.

The formula can start simple and be improved later.

Suggested formula:

combined_score =
historical_frequency_score * 0.45

* current_semester_coverage_score * 0.30
* practice_exam_gap_score * 0.20
* recent_quiz_or_assignment_score * 0.05

The system should store each sub-score separately so the prediction is explainable.

Do not only store the final score.

Each topic should include:

* topic_name
* historical_frequency_score
* current_semester_coverage_score
* practice_exam_gap_score
* recent_quiz_or_assignment_score
* combined_prediction_score
* explanation

---

## Deterministic Output Requirement

If all key variables are the same, the system must return the exact same output.

The system should not generate a new AI response when the same request has already been generated before.

Use cache-first deterministic output.

Before calling the AI model, check whether a cached output already exists.

If a matching cached output exists, return the stored output exactly as it was originally generated.

Only call the AI model if no matching cache entry exists or if the underlying course materials, prediction profile, or prompt version changed.

---

## Cache Key Requirements

Create a stable cache key using normalized input variables.

The cache key should include:

* course_id
* school
* course_code
* semester
* professor_id, if available
* exam_type
* target_score
* days_remaining
* study_minutes_per_day
* uploaded_material_version
* prediction_profile_version
* prompt_version
* output_type

Normalize all inputs before creating the cache key.

Examples:

“MATH135”, “Math 135”, and “math-135” should become the same course_id.

“2 hours”, “2h”, and “120 minutes” should become:

study_minutes_per_day = 120

“50%”, “0.5”, and “pass” should be converted into a consistent target_score according to product rules.

Use SHA-256 over the normalized JSON object to create the cache key.

---

## Cache Logic

The app should follow this logic:

1. Receive user request.
2. Normalize all input variables.
3. Generate cache key from normalized variables.
4. Search the cached_outputs table for the same cache key.
5. If cached output exists, return it exactly.
6. If no cached output exists, load the compressed course prediction profile.
7. Generate the output using the AI model.
8. Store the generated output with the cache key.
9. Return the generated output to the user.

Same normalized variables plus same course material version plus same prediction profile version plus same prompt version must always return the same cached output.

---

## AI Model Settings

For generation tasks, use deterministic model settings where possible.

Recommended settings:

temperature = 0
top_p = 1

However, do not rely on model settings alone for deterministic behavior.

The source of truth for exact same output must be the cached output.

---

## Database Tables

Create or update the Supabase schema to support the following tables.

### courses

Stores course identity and metadata.

Fields:

* id
* school
* course_code
* course_name
* professor_name
* semester
* created_at
* updated_at

### course_materials

Stores uploaded files and document metadata.

Fields:

* id
* course_id
* user_id
* file_name
* file_type
* file_hash
* storage_url
* material_category
* semester
* uploaded_at
* processed_status

material_category should support:

* lecture_slide
* quiz
* assignment
* midterm_practice
* final_practice
* past_midterm
* past_final
* syllabus
* other

### document_chunks

Stores processed document chunks only when needed.

Fields:

* id
* material_id
* course_id
* chunk_index
* chunk_text
* topic_tags
* embedding
* created_at

### course_topics

Stores extracted course topics.

Fields:

* id
* course_id
* topic_name
* parent_topic
* description
* coverage_score
* source_material_ids
* created_at

### exam_questions

Stores extracted exam or practice questions.

Fields:

* id
* course_id
* material_id
* question_text
* question_type
* topic_tags
* difficulty_score
* marks
* year
* exam_type
* created_at

question_type should support:

* multiple_choice
* short_answer
* long_answer
* calculation
* proof
* essay
* coding
* other

### topic_exam_frequency

Stores historical topic frequency.

Fields:

* id
* course_id
* topic_name
* exam_type
* question_type
* frequency_count
* frequency_percentage
* years_observed
* created_at
* updated_at

### practice_exam_gaps

Stores gap analysis between taught topics and practice exam topics.

Fields:

* id
* course_id
* topic_name
* covered_in_class
* appears_in_practice_exam
* gap_risk_score
* explanation
* created_at
* updated_at

### course_prediction_profiles

Stores the compressed reusable course intelligence.

Fields:

* id
* course_id
* material_version
* prediction_profile_version
* profile_json
* high_probability_topics
* recommended_study_priority
* created_at
* updated_at

### cached_outputs

Stores deterministic generated outputs.

Fields:

* id
* cache_key
* course_id
* semester
* professor_id
* exam_type
* target_score
* days_remaining
* study_minutes_per_day
* material_version
* prediction_profile_version
* prompt_version
* output_type
* output_json
* output_text
* model_name
* created_at

cache_key must be unique.

### student_course_profiles

Stores individual student settings.

Fields:

* id
* user_id
* course_id
* target_score
* exam_date
* available_study_minutes_per_day
* weak_topics
* completed_topics
* created_at
* updated_at

---

## Supabase Requirements

Use Supabase as the backend database.

Use Row Level Security where appropriate.

Users should only access their own personal study profile data.

Course-level processed intelligence can be shared across students in the same course if the product allows shared course profiles.

Do not expose other users’ uploaded private files directly.

Shared outputs should use extracted course intelligence, not raw personal uploads.

---

## API Requirements

Create API routes or server actions for:

* creating a course
* uploading course material
* checking duplicate file hash
* processing uploaded material
* generating course prediction profile
* requesting exam prediction
* requesting study plan
* checking cached output
* saving cached output
* retrieving existing course profile

Before every AI generation call, the system must check the cache.

---

## Study Plan Generation

The study plan should be generated from:

* predicted high-probability topics
* target score
* days remaining
* available study minutes per day
* topic difficulty
* student weak areas, if provided
* exam question distribution

The output should be practical and specific.

For example, if the student wants 50%, the system should prioritize the minimum set of high-yield topics most likely to help them pass.

If the student wants 60%, 70%, or 80%+, the system should increase the required topic coverage, practice intensity, and review depth.

The plan should clearly explain:

* what to study
* why it matters
* how long to spend
* what practice questions to do
* what can be skipped if time is limited
* expected score coverage

---

## Output Types

The system should support cached outputs for:

* exam_prediction
* study_plan
* topic_priority_list
* emergency_pass_plan
* final_review_plan
* weak_topic_drill_plan

Each output type should be included in the cache key.

---

## Prompt Versioning

Every AI prompt must have a prompt_version.

If the prompt changes, the prompt_version should be updated.

Changing the prompt_version should invalidate old cached outputs for future requests, because the same inputs may now produce a different expected output.

The system should store prompt_version with every cached output.

---

## Material Versioning

Every course profile must have a material_version.

When new course materials are uploaded and accepted into the course profile, update the material_version.

If material_version changes, cached outputs based on the old version should not be reused.

---

## Prediction Profile Versioning

Every generated course prediction profile must have a prediction_profile_version.

If the prediction algorithm changes or the course profile is regenerated, update the prediction_profile_version.

If prediction_profile_version changes, cached outputs based on the old profile should not be reused.

---

## Frontend Requirements

The user interface should be simple, clean, and student-friendly.

The design should feel similar to QuillBot: simple, useful, fast, and focused.

Use a white and blue color palette.

Main pages should include:

* Home
* Courses
* Upload Materials
* Exam Prediction
* Study Planner
* My Courses
* Pricing
* Account

The interface should clearly show when a course already has materials uploaded.

If a course profile already exists, tell the user that they can generate predictions without uploading documents.

---

## Course Page Requirements

Each course page should show:

* course name
* school
* course code
* semester
* professor, if available
* whether course materials are already available
* last updated date
* available exam prediction types
* upload button for missing or new materials
* generate prediction button
* generate study plan button

---

## Upload Page Requirements

The upload page should allow users to upload:

* slides
* quizzes
* assignments
* practice exams
* past exams
* syllabus

After upload, show processing status:

* uploaded
* duplicate_detected
* processing
* processed
* failed

If duplicate_detected, do not process the document again.

---

## Study Planner Page Requirements

The study planner should ask for:

* course
* exam type
* target score
* exam date or days remaining
* available study time per day
* weak topics, optional

After submission, check the deterministic cache first.

If cached output exists, return it exactly.

If not, generate a new plan and save it.

---

## Engineering Principles

Prioritize:

* low token usage
* deterministic outputs
* cache-first generation
* reusable course intelligence
* explainable prediction scores
* clean database structure
* simple student experience
* scalable architecture

Avoid:

* reprocessing duplicate files
* sending full PDFs to the AI model repeatedly
* generating new outputs for identical inputs
* mixing raw private uploads with shared public course profiles
* relying only on temperature = 0 for deterministic behavior

---

## Non-Negotiable Rules

1. Never call the AI model before checking the cache for generation requests.
2. Never reprocess a duplicate document with the same file hash.
3. Never send all raw course materials to the AI model for normal user requests.
4. Always use the compressed course prediction profile for study plan generation.
5. Always version prompts, materials, and prediction profiles.
6. Always return the exact cached output when the normalized variables are the same.
7. Always store sub-scores for prediction explainability.
8. Always separate shared course intelligence from private student profile data.
9. Do not change the website structure without permission, e.g., do not delete components, pages, or layouts without asking.

---

## Recommended Implementation Order

Build in this order:

1. Supabase schema
2. Course creation flow
3. File upload flow
4. Document hash deduplication
5. Course material processing
6. Topic extraction
7. Exam question classification
8. Course prediction profile generation
9. Cached output table
10. Deterministic cache key logic
11. Exam prediction generation
12. Study plan generation
13. Frontend course pages
14. Frontend upload pages
15. Frontend study planner
16. Pricing and account pages

---

## Expected Outcome

The finished system should allow one student’s uploaded course materials to benefit future students in the same course, while keeping token costs low.

The system should process documents once, store compressed intelligence, reuse course profiles, cache repeated outputs, and return identical results when the same variables are submitted.

The product should feel fast, consistent, and useful for students preparing for exams under time pressure.


<!-- END:nextjs-agent-rules -->
