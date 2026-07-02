import fs from "fs/promises";
import path from "path";

// Define Interfaces
export interface School {
  id: string;
  name: string;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  school_id: string;
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  school_id?: string;
  program_id?: string;
  name: string;
  course_code: string;
  exam_date?: string;
  target_score?: string; // e.g. "50%", "60%", "70%", "80%+"
  daily_available_hours: number;
  current_level?: string; // "weak", "average", "strong"
  review_status?: string; // 'Not Started', 'In Progress', 'Ready'
  created_at: string;
  // Populated fields
  school_name?: string;
  program_name?: string;
  material_count?: number;
  study_plan_generated?: boolean;
}

export interface Material {
  id: string;
  course_id: string;
  name: string;
  material_type: string; // Homework, Quiz, Midterm, Final Exam, Lecture Notes, Practice Questions, Other
  text: string;
  size?: number;
  word_count?: number;
  created_at: string;
}

export interface CourseAnalysis {
  id: string;
  course_id: string;
  summary: string;
  extracted_topics: any; // JSON
  topic_frequency: any; // JSON
  predicted_exam_topics: any; // JSON
  question_bank: any; // JSON
  difficulty_breakdown: any; // JSON
  last_analyzed_at: string;
  source_material_ids: string[];
  analysis_version: number;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  course_id: string;
  target_score: string;
  days_remaining: number;
  daily_available_hours: number;
  plan_json: any; // JSON
  generated_from_analysis_version: number;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

// Database Helpers
const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    return { url: url.replace(/\/$/, ""), key };
  }
  return null;
};

// Local JSON File DB implementation
const getLocalDbPath = () => {
  return path.join(process.cwd(), "src", "utils", "local_db.json");
};

interface LocalDbSchema {
  schools: School[];
  programs: Program[];
  courses: Course[];
  materials: Material[];
  course_analyses: CourseAnalysis[];
  study_plans: StudyPlan[];
  users: UserAccount[];
}

const initializeLocalDb = async (dbPath: string): Promise<LocalDbSchema> => {
  const initialSchema: LocalDbSchema = {
    schools: [],
    programs: [],
    courses: [],
    materials: [],
    course_analyses: [],
    study_plans: [],
    users: [],
  };
  try {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(initialSchema, null, 2), "utf8");
    return initialSchema;
  } catch (error) {
    console.error("Failed to initialize local DB:", error);
    return initialSchema;
  }
};

const readLocalDb = async (): Promise<LocalDbSchema> => {
  const dbPath = getLocalDbPath();
  try {
    const data = await fs.readFile(dbPath, "utf8");
    return JSON.parse(data) as LocalDbSchema;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return await initializeLocalDb(dbPath);
    }
    console.error("Error reading local DB, returning fallback structure:", error);
    return {
      schools: [],
      programs: [],
      courses: [],
      materials: [],
      course_analyses: [],
      study_plans: [],
      users: [],
    };
  }
};

const writeLocalDb = async (data: LocalDbSchema): Promise<void> => {
  const dbPath = getLocalDbPath();
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing to local DB:", error);
  }
};

// Supabase helper request
const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const url = `${config.url}/rest/v1/${endpoint}`;
  const headers = {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Supabase query failed on ${endpoint}: ${response.status} - ${errText}`);
  }
  return response;
};

// ==========================================
// Database API Exports
// ==========================================

export const db = {
  // Schools
  async getSchools(): Promise<School[]> {
    const config = getSupabaseConfig();
    if (config) {
      const res = await supabaseFetch("schools?select=*&order=name.asc");
      return await res.json();
    } else {
      const data = await readLocalDb();
      return [...data.schools].sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  async createSchool(name: string): Promise<School> {
    const trimmedName = name.trim();
    const config = getSupabaseConfig();
    if (config) {
      // First try to check if school already exists
      const checkRes = await supabaseFetch(`schools?name=eq.${encodeURIComponent(trimmedName)}&select=*`);
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        return existing[0];
      }

      const res = await supabaseFetch("schools", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const inserted = await res.json();
      return inserted[0];
    } else {
      const data = await readLocalDb();
      const existing = data.schools.find((s) => s.name.toLowerCase() === trimmedName.toLowerCase());
      if (existing) return existing;

      const newSchool: School = {
        id: crypto.randomUUID(),
        name: trimmedName,
        created_at: new Date().toISOString(),
      };
      data.schools.push(newSchool);
      await writeLocalDb(data);
      return newSchool;
    }
  },

  // Programs
  async getPrograms(schoolId?: string): Promise<Program[]> {
    const config = getSupabaseConfig();
    if (config) {
      const query = schoolId ? `programs?school_id=eq.${schoolId}&select=*&order=name.asc` : "programs?select=*&order=name.asc";
      const res = await supabaseFetch(query);
      return await res.json();
    } else {
      const data = await readLocalDb();
      let list = data.programs;
      if (schoolId) {
        list = list.filter((p) => p.school_id === schoolId);
      }
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  async createProgram(schoolId: string, name: string): Promise<Program> {
    const trimmedName = name.trim();
    const config = getSupabaseConfig();
    if (config) {
      // Check duplicate
      const checkRes = await supabaseFetch(
        `programs?school_id=eq.${schoolId}&name=eq.${encodeURIComponent(trimmedName)}&select=*`
      );
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        return existing[0];
      }

      const res = await supabaseFetch("programs", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ school_id: schoolId, name: trimmedName }),
      });
      const inserted = await res.json();
      return inserted[0];
    } else {
      const data = await readLocalDb();
      const existing = data.programs.find(
        (p) => p.school_id === schoolId && p.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) return existing;

      const newProgram: Program = {
        id: crypto.randomUUID(),
        school_id: schoolId,
        name: trimmedName,
        created_at: new Date().toISOString(),
      };
      data.programs.push(newProgram);
      await writeLocalDb(data);
      return newProgram;
    }
  },

  // Courses
  async getCourse(courseId: string): Promise<Course | null> {
    const config = getSupabaseConfig();
    if (config) {
      try {
        const res = await supabaseFetch(`courses?id=eq.${courseId}&select=*`);
        const list = await res.json();
        if (list && list.length > 0) {
          const schools = await this.getSchools();
          const programs = await this.getPrograms();
          const c = list[0];
          const sch = schools.find((s) => s.id === c.school_id);
          const prog = programs.find((p) => p.id === c.program_id);
          return {
            ...c,
            school_name: sch?.name || "Unknown School",
            program_name: prog?.name || "Unknown Major",
          };
        }
      } catch (err) {
        console.error("Error fetching single course from Supabase:", err);
      }
      return null;
    } else {
      const data = await readLocalDb();
      const c = data.courses.find((c) => c.id === courseId);
      if (c) {
        const sch = data.schools.find((s) => s.id === c.school_id);
        const prog = data.programs.find((p) => p.id === c.program_id);
        return {
          ...c,
          school_name: sch?.name || "Unknown School",
          program_name: prog?.name || "Unknown Major",
        };
      }
      return null;
    }
  },

  async getCourses(userId: string): Promise<Course[]> {
    const config = getSupabaseConfig();
    if (config) {
      // Fetch courses for user
      const res = await supabaseFetch(`courses?user_id=eq.${userId}&select=*&order=created_at.desc`);
      const courses: Course[] = await res.json();

      // Retrieve schools & programs & materials to populate references (in REST API we do manual map or nested joins, since anonymous, we can do client side joins or get reference lists)
      const schools = await this.getSchools();
      const programs = await this.getPrograms();

      // Also get material counts
      const matsRes = await supabaseFetch("materials?select=id,course_id");
      const matsList: { id: string; course_id: string }[] = await matsRes.json();

      // Also get generated study plans
      const plansRes = await supabaseFetch(`study_plans?user_id=eq.${userId}&select=course_id`);
      const plansList: { course_id: string }[] = await plansRes.json();

      return courses.map((c) => {
        const sch = schools.find((s) => s.id === c.school_id);
        const prog = programs.find((p) => p.id === c.program_id);
        const matCount = matsList.filter((m) => m.course_id === c.id).length;
        const planExists = plansList.some((p) => p.course_id === c.id);

        return {
          ...c,
          school_name: sch?.name || "Unknown School",
          program_name: prog?.name || "Unknown Major",
          material_count: matCount,
          study_plan_generated: planExists,
        };
      });
    } else {
      const data = await readLocalDb();
      const userCourses = data.courses.filter((c) => c.user_id === userId);

      return userCourses.map((c) => {
        const sch = data.schools.find((s) => s.id === c.school_id);
        const prog = data.programs.find((p) => p.id === c.program_id);
        const matCount = data.materials.filter((m) => m.course_id === c.id).length;
        const planExists = data.study_plans.some((p) => p.course_id === c.id);

        return {
          ...c,
          school_name: sch?.name || "Unknown School",
          program_name: prog?.name || "Unknown Major",
          material_count: matCount,
          study_plan_generated: planExists,
        };
      });
    }
  },

  async getAllCourses(): Promise<Course[]> {
    const config = getSupabaseConfig();
    if (config) {
      try {
        const res = await supabaseFetch("courses?select=*");
        return await res.json();
      } catch (err) {
        console.error("Error fetching all courses from Supabase:", err);
        return [];
      }
    } else {
      const data = await readLocalDb();
      return data.courses || [];
    }
  },

  async createCourse(course: Omit<Course, "id" | "created_at">): Promise<Course> {
    const config = getSupabaseConfig();
    if (config) {
      const res = await supabaseFetch("courses", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(course),
      });
      const inserted = await res.json();
      return inserted[0];
    } else {
      const data = await readLocalDb();
      const newCourse: Course = {
        ...course,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      data.courses.push(newCourse);
      await writeLocalDb(data);
      return newCourse;
    }
  },

  async updateCourse(courseId: string, updates: Partial<Omit<Course, "id" | "created_at" | "user_id">>): Promise<Course> {
    const config = getSupabaseConfig();
    if (config) {
      const res = await supabaseFetch(`courses?id=eq.${courseId}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      return updated[0];
    } else {
      const data = await readLocalDb();
      const courseIdx = data.courses.findIndex((c) => c.id === courseId);
      if (courseIdx === -1) throw new Error("Course not found");

      const updatedCourse = {
        ...data.courses[courseIdx],
        ...updates,
      };
      data.courses[courseIdx] = updatedCourse;
      await writeLocalDb(data);
      return updatedCourse;
    }
  },

  async deleteCourse(courseId: string): Promise<boolean> {
    const config = getSupabaseConfig();
    if (config) {
      await supabaseFetch(`courses?id=eq.${courseId}`, {
        method: "DELETE",
      });
      return true;
    } else {
      const data = await readLocalDb();
      data.courses = data.courses.filter((c) => c.id !== courseId);
      data.materials = data.materials.filter((m) => m.course_id !== courseId);
      data.course_analyses = data.course_analyses.filter((a) => a.course_id !== courseId);
      data.study_plans = data.study_plans.filter((p) => p.course_id !== courseId);
      await writeLocalDb(data);
      return true;
    }
  },

  // Materials
  async getMaterials(courseId: string): Promise<Material[]> {
    const config = getSupabaseConfig();
    if (config) {
      const res = await supabaseFetch(`materials?course_id=eq.${courseId}&select=*&order=created_at.desc`);
      return await res.json();
    } else {
      const data = await readLocalDb();
      return data.materials.filter((m) => m.course_id === courseId);
    }
  },

  async createMaterial(material: Omit<Material, "id" | "created_at">): Promise<Material> {
    const config = getSupabaseConfig();
    if (config) {
      const res = await supabaseFetch("materials", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(material),
      });
      const inserted = await res.json();
      return inserted[0];
    } else {
      const data = await readLocalDb();
      const newMaterial: Material = {
        ...material,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      data.materials.push(newMaterial);
      await writeLocalDb(data);
      return newMaterial;
    }
  },

  async deleteMaterial(materialId: string): Promise<boolean> {
    const config = getSupabaseConfig();
    if (config) {
      await supabaseFetch(`materials?id=eq.${materialId}`, {
        method: "DELETE",
      });
      return true;
    } else {
      const data = await readLocalDb();
      data.materials = data.materials.filter((m) => m.id !== materialId);
      await writeLocalDb(data);
      return true;
    }
  },

  // Course Analyses
  async getCourseAnalysis(courseId: string): Promise<CourseAnalysis | null> {
    const config = getSupabaseConfig();
    if (config) {
      const res = await supabaseFetch(`course_analyses?course_id=eq.${courseId}&select=*`);
      const list = await res.json();
      return list && list.length > 0 ? list[0] : null;
    } else {
      const data = await readLocalDb();
      const analysis = data.course_analyses.find((a) => a.course_id === courseId);
      return analysis || null;
    }
  },

  async saveCourseAnalysis(analysis: Omit<CourseAnalysis, "id" | "created_at" | "last_analyzed_at">): Promise<CourseAnalysis> {
    const config = getSupabaseConfig();
    const timestamp = new Date().toISOString();
    if (config) {
      const existing = await this.getCourseAnalysis(analysis.course_id);
      if (existing) {
        // Update
        const res = await supabaseFetch(`course_analyses?id=eq.${existing.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            ...analysis,
            last_analyzed_at: timestamp,
          }),
        });
        const updated = await res.json();
        return updated[0];
      } else {
        // Insert
        const res = await supabaseFetch("course_analyses", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            ...analysis,
            last_analyzed_at: timestamp,
          }),
        });
        const inserted = await res.json();
        return inserted[0];
      }
    } else {
      const data = await readLocalDb();
      const existingIdx = data.course_analyses.findIndex((a) => a.course_id === analysis.course_id);

      if (existingIdx !== -1) {
        const updatedAnalysis = {
          ...data.course_analyses[existingIdx],
          ...analysis,
          last_analyzed_at: timestamp,
        };
        data.course_analyses[existingIdx] = updatedAnalysis;
        await writeLocalDb(data);
        return updatedAnalysis;
      } else {
        const newAnalysis: CourseAnalysis = {
          ...analysis,
          id: crypto.randomUUID(),
          created_at: timestamp,
          last_analyzed_at: timestamp,
        };
        data.course_analyses.push(newAnalysis);
        await writeLocalDb(data);
        return newAnalysis;
      }
    }
  },

  // Study Plans
  async getStudyPlans(userId: string): Promise<StudyPlan[]> {
    const config = getSupabaseConfig();
    if (config) {
      const res = await supabaseFetch(`study_plans?user_id=eq.${userId}&select=*&order=updated_at.desc`);
      return await res.json();
    } else {
      const data = await readLocalDb();
      return data.study_plans.filter((p) => p.user_id === userId);
    }
  },

  async getStudyPlan(courseId: string): Promise<StudyPlan | null> {
    const config = getSupabaseConfig();
    if (config) {
      const res = await supabaseFetch(`study_plans?course_id=eq.${courseId}&select=*`);
      const list = await res.json();
      return list && list.length > 0 ? list[0] : null;
    } else {
      const data = await readLocalDb();
      const plan = data.study_plans.find((p) => p.course_id === courseId);
      return plan || null;
    }
  },

  async saveStudyPlan(plan: Omit<StudyPlan, "id" | "created_at" | "updated_at">): Promise<StudyPlan> {
    const config = getSupabaseConfig();
    const timestamp = new Date().toISOString();
    if (config) {
      const existing = await this.getStudyPlan(plan.course_id);
      if (existing) {
        // Update
        const res = await supabaseFetch(`study_plans?id=eq.${existing.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            ...plan,
            updated_at: timestamp,
          }),
        });
        const updated = await res.json();
        return updated[0];
      } else {
        // Insert
        const res = await supabaseFetch("study_plans", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            ...plan,
            created_at: timestamp,
            updated_at: timestamp,
          }),
        });
        const inserted = await res.json();
        return inserted[0];
      }
    } else {
      const data = await readLocalDb();
      const existingIdx = data.study_plans.findIndex((p) => p.course_id === plan.course_id);

      if (existingIdx !== -1) {
        const updatedPlan = {
          ...data.study_plans[existingIdx],
          ...plan,
          updated_at: timestamp,
        };
        data.study_plans[existingIdx] = updatedPlan;
        await writeLocalDb(data);
        return updatedPlan;
      } else {
        const newPlan: StudyPlan = {
          ...plan,
          id: crypto.randomUUID(),
          created_at: timestamp,
          updated_at: timestamp,
        };
        data.study_plans.push(newPlan);
        await writeLocalDb(data);
        return newPlan;
      }
    }
  },

  // Users
  async registerUser(email: string, passwordHash: string, name: string): Promise<UserAccount> {
    const config = getSupabaseConfig();
    const timestamp = new Date().toISOString();
    const trimmedEmail = email.trim().toLowerCase();
    
    if (config) {
      try {
        const checkRes = await supabaseFetch(`users?email=eq.${encodeURIComponent(trimmedEmail)}&select=*`);
        const existing = await checkRes.json();
        if (existing && existing.length > 0) {
          throw new Error("Email already registered.");
        }

        const res = await supabaseFetch("users", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            email: trimmedEmail,
            password_hash: passwordHash,
            name: name.trim(),
          }),
        });
        const inserted = await res.json();
        return inserted[0];
      } catch (err: any) {
        throw new Error(err.message || "Failed to register user in Supabase.");
      }
    } else {
      const data = await readLocalDb();
      if (!data.users) data.users = [];
      const existing = data.users.find((u) => u.email.toLowerCase() === trimmedEmail);
      if (existing) {
        throw new Error("Email already registered.");
      }

      const newUser: UserAccount = {
        id: crypto.randomUUID(),
        email: trimmedEmail,
        password_hash: passwordHash,
        name: name.trim(),
        created_at: timestamp,
      };
      data.users.push(newUser);
      await writeLocalDb(data);
      return newUser;
    }
  },

  async loginUser(email: string, passwordHash: string): Promise<UserAccount | null> {
    const config = getSupabaseConfig();
    const trimmedEmail = email.trim().toLowerCase();

    if (config) {
      try {
        const res = await supabaseFetch(`users?email=eq.${encodeURIComponent(trimmedEmail)}&password_hash=eq.${encodeURIComponent(passwordHash)}&select=*`);
        const list = await res.json();
        return list && list.length > 0 ? list[0] : null;
      } catch (err) {
        console.error("Error authenticating against Supabase:", err);
        return null;
      }
    } else {
      const data = await readLocalDb();
      if (!data.users) data.users = [];
      const user = data.users.find(
        (u) => u.email.toLowerCase() === trimmedEmail && u.password_hash === passwordHash
      );
      return user || null;
    }
  },

  async getOrCreateGoogleUser(email: string, name: string, avatarUrl?: string): Promise<UserAccount> {
    const config = getSupabaseConfig();
    const timestamp = new Date().toISOString();
    const trimmedEmail = email.trim().toLowerCase();

    if (config) {
      try {
        const checkRes = await supabaseFetch(`users?email=eq.${encodeURIComponent(trimmedEmail)}&select=*`);
        const existing = await checkRes.json();
        if (existing && existing.length > 0) {
          const user = existing[0];
          if (avatarUrl && user.avatar_url !== avatarUrl) {
            await supabaseFetch(`users?id=eq.${user.id}`, {
              method: "PATCH",
              body: JSON.stringify({ avatar_url: avatarUrl }),
            });
            user.avatar_url = avatarUrl;
          }
          return user;
        }

        const res = await supabaseFetch("users", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            email: trimmedEmail,
            name: name.trim(),
            avatar_url: avatarUrl,
          }),
        });
        const inserted = await res.json();
        return inserted[0];
      } catch (err) {
        console.error("Error managing Google user in Supabase:", err);
      }
    }

    // Local DB fallback
    const data = await readLocalDb();
    if (!data.users) data.users = [];
    const existing = data.users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      if (avatarUrl) existing.avatar_url = avatarUrl;
      await writeLocalDb(data);
      return existing;
    }

    const newUser: UserAccount = {
      id: crypto.randomUUID(),
      email: trimmedEmail,
      name: name.trim(),
      avatar_url: avatarUrl,
      created_at: timestamp,
    };
    data.users.push(newUser);
    await writeLocalDb(data);
    return newUser;
  },

  async getUser(userId: string): Promise<UserAccount | null> {
    const config = getSupabaseConfig();
    if (config) {
      try {
        const res = await supabaseFetch(`users?id=eq.${userId}&select=*`);
        const list = await res.json();
        return list && list.length > 0 ? list[0] : null;
      } catch (err) {
        console.error("Error retrieving user from Supabase:", err);
        return null;
      }
    } else {
      const data = await readLocalDb();
      if (!data.users) data.users = [];
      const user = data.users.find((u) => u.id === userId);
      return user || null;
    }
  },
};
