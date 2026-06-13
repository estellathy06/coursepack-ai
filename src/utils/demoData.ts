export interface CourseMapItem {
  week: string;
  topic: string;
  concepts: string[];
  weight: string;
  source: string;
}

export interface ExamFocusItem {
  concept: string;
  importance: 'High' | 'Medium' | 'Low';
  explanation: string;
  likelyQuestion: string;
  tips: string;
  source: string;
}

export interface DefinitionItem {
  term: string;
  definition: string;
  formula?: string;
  confusionPoint?: string;
  source: string;
}

export interface ActiveRecallItem {
  question: string;
  answer: string;
  hint: string;
  source: string;
}

export interface QuizItem {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of options
  explanation: string;
  source: string;
}

export interface DayPlan {
  day: number;
  focus: string;
  tasks: string[];
}

export interface WeakSpotItem {
  concept: string;
  coverage: string;
  action: string;
  source: string;
}

export interface StudyPack {
  courseCode: string;
  courseName: string;
  university: string;
  summary: string;
  courseMap: CourseMapItem[];
  examFocus: ExamFocusItem[];
  definitions: DefinitionItem[];
  activeRecall: ActiveRecallItem[];
  quiz: QuizItem[];
  sevenDayPlan: DayPlan[];
  weakSpots: WeakSpotItem[];
}

export const demoStudyPacks: Record<string, StudyPack> = {
  "CS136": {
    courseCode: "CS 136",
    courseName: "Elementary Algorithm Design and Data Abstraction",
    university: "University of Waterloo",
    summary: "CS 136 builds on CS 135, transitioning from Racket (functional programming) to C (imperative programming). The course covers memory management (stack vs heap), pointers, arrays, basic data structures (linked lists, trees, hash tables), and algorithm efficiency (Big-O analysis).",
    courseMap: [
      {
        week: "Weeks 1-2",
        topic: "Transition to C & Basic Syntax",
        concepts: ["C compiler", "Types & Variables", "Control flow", "Functions & Scope"],
        weight: "10% of Final Exam",
        source: "Syllabus Section 3.1"
      },
      {
        week: "Weeks 3-4",
        topic: "Pointers & Memory Allocation",
        concepts: ["Pointer arithmetic", "Stack vs Heap memory", "malloc/calloc/free", "Memory leaks"],
        weight: "25% of Final Exam",
        source: "Syllabus Section 3.2 & Slides 7-9"
      },
      {
        week: "Weeks 5-7",
        topic: "Structures & Abstract Data Types (ADTs)",
        concepts: ["structs", "Header files & modularity", "Linked Lists (singly, doubly)", "Stack & Queue ADTs"],
        weight: "25% of Final Exam",
        source: "Syllabus Section 3.4 & Slides 12-15"
      },
      {
        week: "Weeks 8-9",
        topic: "Trees & Recursion",
        concepts: ["Binary Search Trees (BST)", "Tree traversals (pre/in/post-order)", "Insertion/Deletion in BST"],
        weight: "20% of Final Exam",
        source: "Syllabus Section 3.5 & Slides 18-20"
      },
      {
        week: "Weeks 10-12",
        topic: "Sorting, Hashing, & Big-O",
        concepts: ["O(n log n) sorting (Mergesort, Quicksort)", "Hash functions & collision resolution", "Asymptotic analysis"],
        weight: "20% of Final Exam",
        source: "Syllabus Section 3.6 & Slides 22-25"
      }
    ],
    examFocus: [
      {
        concept: "Manual Memory Management & Memory Leaks",
        importance: "High",
        explanation: "Since C requires programmers to explicitly request and release heap memory, the exam will heavily test your ability to trace pointers, detect memory leaks, and prevent dangling pointer dereferences.",
        likelyQuestion: "Given a C function containing multiple conditional returns, trace the allocations and identify which code path leaks memory. Write the corrected function.",
        tips: "Always ensure every malloc/calloc has a corresponding free() executed on all possible execution paths. Write helper cleanup functions for complex structs.",
        source: "Midterm Rubric & Lecture Slides 9"
      },
      {
        concept: "Linked List Reversal & Manipulation",
        importance: "High",
        explanation: "Pointers manipulation is the core skill of CS 136. Reversing a singly linked list in-place or inserting/deleting elements in a sorted list are classic examination problems.",
        likelyQuestion: "Write an in-place function `struct node *reverse(struct node *head)` that reverses a singly linked list and returns the new head, using O(1) auxiliary space.",
        tips: "Maintain three pointer variables: prev, curr, and next. Draw out the pointer links on paper before writing the code to ensure you don't dereference NULL.",
        source: "Assignment 6 Rubric & Lecture Slides 13"
      },
      {
        concept: "BST Validation and Height Calculations",
        importance: "Medium",
        explanation: "Testing tree properties using recursive algorithms. The exam will require you to write functions that check if a binary tree is a valid BST or compute its height/balance.",
        likelyQuestion: "Write a recursive function `bool is_bst(struct treenode *node, int min, int max)` that checks if a binary tree satisfies the BST property.",
        tips: "Don't just check if `left < parent` and `right > parent` at each node locally. You must pass down the bounding range `[min, max]` to all recursive steps.",
        source: "Lecture Slides 19"
      }
    ],
    definitions: [
      {
        term: "Pointer",
        definition: "A variable that stores the memory address of another variable rather than a direct value.",
        formula: "int *p = &x; // stores address of x",
        confusionPoint: "Students confuse `*p` (dereferencing to get the value at the address) with `p` (the address itself) and `&p` (the address of the pointer variable).",
        source: "Slides: Lecture 7, Page 3"
      },
      {
        term: "Memory Leak",
        definition: "A failure in a program to release discarded heap memory, causing the operating system to keep it allocated, which can eventually run the system out of memory.",
        confusionPoint: "Losing the pointer referencing a block of heap memory before calling free() makes it impossible to release that memory for the remainder of the execution.",
        source: "Slides: Lecture 9, Page 14"
      },
      {
        term: "Stack Memory",
        definition: "Memory automatically managed by the compiler for local variables and function call frames. Allocation and deallocation are extremely fast and follow LIFO order.",
        confusionPoint: "Returning a pointer to a local stack variable from a function is a critical bug because that stack frame is popped and overwritten after return.",
        source: "Slides: Lecture 8, Page 5"
      },
      {
        term: "Heap Memory",
        definition: "A region of memory used for dynamic allocations at runtime. It must be explicitly managed by the programmer using malloc/calloc and free.",
        confusionPoint: "Allocated memory persists until free() is called or the program exits. Unlike stack memory, it has no scoping rules.",
        source: "Slides: Lecture 8, Page 9"
      }
    ],
    activeRecall: [
      {
        question: "Why does returning a pointer to a stack-allocated variable from a function cause undefined behavior in C?",
        answer: "Stack variables are automatically deallocated (their stack frame is popped) when the function exits. The memory address returned now points to invalid, unreserved memory that will be overwritten during subsequent function calls. To return a valid pointer, you must allocate memory on the Heap using malloc.",
        hint: "Think about the lifecycle of local variables vs dynamic memory.",
        source: "Slides: Lecture 8, Page 11"
      },
      {
        question: "What is the difference between malloc() and calloc() in memory allocation?",
        answer: "malloc(size) takes a single parameter representing the total bytes to allocate and leaves the memory uninitialized (containing garbage data). calloc(num, size) takes two parameters (number of elements and size of each element), allocates the memory, and automatically initializes all bytes to zero.",
        hint: "Initialization is the main difference.",
        source: "Slides: Lecture 9, Page 4"
      },
      {
        question: "What happens if you free a pointer that has already been freed (a double free)?",
        answer: "A double free causes undefined behavior, often resulting in a program crash or severe security vulnerabilities (heap exploitation). To prevent this, it is best practice to set pointers to NULL immediately after freeing them, since calling free(NULL) is safe and has no effect.",
        hint: "It corrupts the heap manager's metadata.",
        source: "Slides: Lecture 9, Page 21"
      }
    ],
    quiz: [
      {
        id: 1,
        question: "Which of the following declarations represents an array of 5 pointers to integers?",
        options: [
          "int *p[5];",
          "int (*p)[5];",
          "int **p[5];",
          "int *p5;"
        ],
        correctAnswer: 0,
        explanation: "Due to operator precedence, index brackets `[]` bind tighter than the dereference operator `*`. Thus, `int *p[5]` is an array of 5 elements of type `int *`. Parentheses would be needed (like `int (*p)[5]`) to declare a single pointer to an array of 5 integers.",
        source: "Lecture Slides 11, Page 8"
      },
      {
        id: 2,
        question: "In the worst-case scenario, what is the time complexity of searching for a value in a Binary Search Tree (BST)?",
        options: [
          "O(1)",
          "O(log n)",
          "O(n)",
          "O(n log n)"
        ],
        correctAnswer: 2,
        explanation: "In the worst case, a BST can become completely unbalanced (degenerate into a linear structure, resembling a linked list). In this case, searching takes O(n) operations. If the BST is balanced, the search time complexity is O(log n).",
        source: "Lecture Slides 19, Page 15"
      },
      {
        id: 3,
        question: "What is the result of executing the code: `char *p = malloc(10); strcpy(p, \"Waterloo\"); p += 3; free(p);`?",
        options: [
          "Successfully frees the remaining 7 bytes of memory.",
          "Undefined behavior / heap corruption error.",
          "Memory leak of the first 3 bytes only.",
          "Compilation error on the free() call."
        ],
        correctAnswer: 1,
        explanation: "You must pass the exact address returned by malloc/calloc to free(). Modifying the pointer (`p += 3`) and then calling free(p) corrupts the heap management metadata because the heap manager cannot find the allocation details for that shifted address.",
        source: "Lecture Slides 9, Page 25"
      }
    ],
    sevenDayPlan: [
      {
        day: 1,
        focus: "Syllabus Review & Basic Syntax Re-familiarization",
        tasks: [
          "Review Syllabus grade breakdowns to understand weighting.",
          "Study slides on C control flow, scope rules, and basic operators.",
          "Practice compiling simple programs with gcc flags (-Wall -Wextra -Werror)."
        ]
      },
      {
        day: 2,
        focus: "Deep Dive into Pointers & Stack/Heap Tracing",
        tasks: [
          "Re-read Slides 7 & 8 on Stack frames and Heap variables.",
          "Perform memory leak diagnostics on your past assignment code.",
          "Trace pointer mutations on paper using box-and-arrow diagrams."
        ]
      },
      {
        day: 3,
        focus: "Dynamic Memory Management & Safety",
        tasks: [
          "Write 3 helper functions utilizing malloc, calloc, and realloc.",
          "Answer Active Recall questions #1 and #2 to solidify understanding of stack vs heap.",
          "Verify that all allocation check patterns handles NULL pointers correctly."
        ]
      },
      {
        day: 4,
        focus: "Modular Programming & Struct ADTs",
        tasks: [
          "Study header guard patterns and compile files separately with compiler.",
          "Build a robust singly linked list implementation from memory.",
          "Review Rubrics from Assignments 5 and 6."
        ]
      },
      {
        day: 5,
        focus: "Advanced Data Structures (Linked Lists & BSTs)",
        tasks: [
          "Write the linked list in-place reversal function.",
          "Implement BST insertion, search, and depth tracking algorithms recursively.",
          "Practice tracing BST deletion when the target node has two children."
        ]
      },
      {
        day: 6,
        focus: "Sorting Algorithms, Hashing & Big-O",
        tasks: [
          "Memorize worst-case and average-case runtimes for Quicksort, Mergesort, Insertion Sort.",
          "Study hash collisions (linear probing vs chaining) and trace index calculations.",
          "Take the interactive 'Quiz Me' section and identify your weak spots."
        ]
      },
      {
        day: 7,
        focus: "Final Cramming & Cheat Sheet Checklist",
        tasks: [
          "Review the Weak Spots tab and reread sections with low confidence.",
          "Compile a 1-page cheatsheet containing BST recursive structures and pointer rules.",
          "Rest up and prepare for the 3-hour exam!"
        ]
      }
    ],
    weakSpots: [
      {
        concept: "Dangling Pointers in Struct Node Deallocation",
        coverage: "Slightly addressed in Slide 14, but heavily weighted in Assignment 6 rubric (15 points).",
        action: "Review recursive deallocation for trees/linked lists. Make sure child pointers are set to NULL or freed before parent structs are released.",
        source: "Assignment 6 Rubric"
      },
      {
        concept: "Worst-Case Quicksort Partitioning",
        coverage: "Briefly mentioned in Lecture 23 slide 8, but frequently queried in old exams.",
        action: "Review why choosing the first element as a pivot on a sorted list yields O(n^2) runtime. Study randomized pivot selectors.",
        source: "Lecture Slides 23"
      }
    ]
  },
  "MATH137": {
    courseCode: "MATH 137",
    courseName: "Calculus I for Honours Mathematics",
    university: "University of Waterloo",
    summary: "MATH 137 is a rigorous introduction to real analysis and calculus, focusing on proofs and definitions rather than just computations. Key topics include the Epsilon-Delta definition of limits, sequences, series convergence tests, Taylor polynomials, and the Intermediate Value Theorem.",
    courseMap: [
      {
        week: "Weeks 1-3",
        topic: "Axioms & Epsilon-Delta Limits",
        concepts: ["Completeness Axiom", "Infimum & Supremum", "Epsilon-Delta proofs for limits", "Limits at infinity"],
        weight: "15% of Final Exam",
        source: "Syllabus Section 2.1"
      },
      {
        week: "Weeks 4-6",
        topic: "Continuity & Differentiability Theorems",
        concepts: ["Intermediate Value Theorem (IVT)", "Extreme Value Theorem (EVT)", "Mean Value Theorem (MVT)", "L'Hopital's Rule"],
        weight: "25% of Final Exam",
        source: "Syllabus Section 2.3 & Lecture Notes 5-8"
      },
      {
        week: "Weeks 7-8",
        topic: "Taylor Polynomials & Approximations",
        concepts: ["Taylor's Theorem", "Lagrange Remainder", "Error bounds", "Big-O notation for expansions"],
        weight: "25% of Final Exam",
        source: "Syllabus Section 2.4 & Lecture Notes 10-12"
      },
      {
        week: "Weeks 9-12",
        topic: "Sequences, Series & Convergence Tests",
        concepts: ["Monotone Convergence Theorem", "Comparison/Ratio/Root tests", "Alternating Series Test", "Taylor Series & radius of convergence"],
        weight: "35% of Final Exam",
        source: "Syllabus Section 2.5 & Lecture Notes 14-20"
      }
    ],
    examFocus: [
      {
        concept: "Epsilon-Delta Limit Proofs",
        importance: "High",
        explanation: "The final exam always contains at least one formal Epsilon-Delta proof. You must prove a specific limit exists using algebraic manipulations to bounding delta in terms of epsilon.",
        likelyQuestion: "Prove that limit as x approaches 3 of (x^2 - 2x) equals 3 using the formal definition.",
        tips: "Start with |f(x) - L| < epsilon. Factor out |x - a|. Assume delta <= 1 to put an upper bound on the other terms, then choose delta = min(1, epsilon/C) where C is your upper bound.",
        source: "Midterm grading criteria & Notes p. 45"
      },
      {
        concept: "Taylor Error Bound using Lagrange Remainder",
        importance: "High",
        explanation: "A key application of Taylor's Theorem is estimating functions within a margin of error. You will be asked to find the degree of Taylor polynomial required to approximate a value within a specified accuracy.",
        likelyQuestion: "Approximate cos(0.2) to within 10^-5 using a Taylor Polynomial centered at 0. Find the degree n required and write the approximation.",
        tips: "Write down the Lagrange Remainder term R_n(x) = f^(n+1)(c) * x^(n+1) / (n+1)!. Use the maximum value of f^(n+1)(c) over the interval [0, x] to establish a bound.",
        source: "Assignment 8 Rubric"
      },
      {
        concept: "Series Convergence Categorization",
        importance: "High",
        explanation: "A major portion of the final exam requires you to classify series as absolutely convergent, conditionally convergent, or divergent, specifying the test used.",
        likelyQuestion: "Determine whether the series sum from n=1 to infinity of (-1)^n * n / (n^2 + 1) converges absolutely, conditionally, or diverges.",
        tips: "Check limit of terms first (Divergence Test). If it goes to 0, check absolute convergence (Limit Comparison with 1/n). If that diverges, use Alternating Series Test for conditional convergence.",
        source: "Lecture Notes 18"
      }
    ],
    definitions: [
      {
        term: "Supremum (LUB)",
        definition: "The least upper bound of a set. The smallest real number that is greater than or equal to every number in the set.",
        confusionPoint: "Students confuse Supremum with Maximum. A supremum does not need to belong to the set (e.g. supremum of interval (0, 1) is 1, which is not in the set).",
        source: "Notes: Section 1.2"
      },
      {
        term: "Epsilon-Delta Limit",
        definition: "The statement that the limit of f(x) as x approaches a is L means that for every epsilon > 0, there exists a delta > 0 such that if 0 < |x - a| < delta, then |f(x) - L| < epsilon.",
        formula: "0 < |x - a| < \\delta \\implies |f(x) - L| < \\epsilon",
        confusionPoint: "Many students mix up the implications, trying to define delta first instead of showing delta depends on the chosen arbitrary epsilon.",
        source: "Notes: Section 3.1"
      },
      {
        term: "Lagrange Remainder",
        definition: "The error term when approximating a function f(x) with its n-th degree Taylor polynomial P_n(x) centered at a.",
        formula: "R_n(x) = \\frac{f^{(n+1)}(c)}{(n+1)!}(x-a)^{n+1} \\text{ for some } c \\text{ between } a \\text{ and } x",
        confusionPoint: "The value of 'c' is unknown, we only know it lies strictly between the center 'a' and the evaluation point 'x'.",
        source: "Notes: Section 7.3"
      }
    ],
    activeRecall: [
      {
        question: "State the Intermediate Value Theorem (IVT) and its preconditions.",
        answer: "If f is continuous on a closed interval [a, b], and N is any number between f(a) and f(b) (where f(a) != f(b)), then there exists a number c in (a, b) such that f(c) = N. The critical precondition is that the function must be continuous on a closed interval.",
        hint: "Continuity on [a, b] is vital.",
        source: "Notes: Section 5.1"
      },
      {
        question: "What is the difference between absolute convergence and conditional convergence of an infinite series?",
        answer: "A series Sum(a_n) is absolutely convergent if the series of absolute values Sum(|a_n|) converges. A series converges conditionally if Sum(a_n) converges but Sum(|a_n|) diverges (for example, the alternating harmonic series). Absolute convergence implies convergence; conditional convergence does not.",
        hint: "Think about the absolute value signs.",
        source: "Notes: Section 9.4"
      },
      {
        question: "State the Monotone Convergence Theorem for sequences.",
        answer: "Every bounded, monotonic (strictly increasing or strictly decreasing) sequence of real numbers is convergent. If a sequence is increasing and bounded above, it converges to its supremum. If decreasing and bounded below, it converges to its infimum.",
        hint: "Needs two properties: bounded and monotonic.",
        source: "Notes: Section 8.2"
      }
    ],
    quiz: [
      {
        id: 1,
        question: "If a sequence {a_n} converges to L, what can we say about the limit of its sequence of averages s_n = (a_1 + a_2 + ... + a_n) / n?",
        options: [
          "It diverges.",
          "It converges to L / 2.",
          "It also converges to L.",
          "We cannot determine convergence without knowing {a_n}."
        ],
        correctAnswer: 2,
        explanation: "By Cauchy's First Theorem on Limits, if a sequence {a_n} converges to L, then the sequence of arithmetic means s_n = (a_1 + a_2 + ... + a_n)/n also converges to L.",
        source: "Notes: Section 8.4, Theorem 4"
      },
      {
        id: 2,
        question: "What is the interval of convergence of the power series Sum_{n=1}^{infinity} (x - 2)^n / n?",
        options: [
          "(1, 3)",
          "[1, 3)",
          "(1, 3]",
          "[1, 3]"
        ],
        correctAnswer: 1,
        explanation: "Using the Ratio Test, the radius of convergence is R = 1, so the series converges for |x - 2| < 1, which means 1 < x < 3. Testing endpoints: For x = 3, the series becomes Sum(1/n) (harmonic series, diverges). For x = 1, it becomes Sum((-1)^n/n) (alternating harmonic series, converges). Thus, the interval is [1, 3).",
        source: "Notes: Section 10.2, Example 3"
      },
      {
        id: 3,
        question: "Which test is most appropriate to determine the convergence of the series Sum (2^n + 3) / (5^n - n)?",
        options: [
          "Ratio Test",
          "Limit Comparison Test with Sum (2/5)^n",
          "Integral Test",
          "Divergence Test"
        ],
        correctAnswer: 1,
        explanation: "The dominant terms in the numerator and denominator are 2^n and 5^n. Performing a Limit Comparison Test with the geometric series Sum(2/5)^n reveals the terms behave similarly at infinity. Since Sum(2/5)^n converges (r = 2/5 < 1), the original series converges.",
        source: "Notes: Section 9.3, Page 112"
      }
    ],
    sevenDayPlan: [
      {
        day: 1,
        focus: "Real Number Axioms & Epsilon-Delta Proofs",
        tasks: [
          "Review Infimum/Supremum and solve 3 bound finding problems.",
          "Write out 4 formal Epsilon-Delta proofs for linear and quadratic functions.",
          "Memorize the definition of limit for both finite values and infinity."
        ]
      },
      {
        day: 2,
        focus: "Limits Theorems & Continuous Functions",
        tasks: [
          "Solve 10 limit calculation problems using algebraic manipulations.",
          "Review the proofs of the Intermediate Value Theorem and Extreme Value Theorem.",
          "Identify and sketch functions with jump, removable, and infinite discontinuities."
        ]
      },
      {
        day: 3,
        focus: "Differentiability, Mean Value Theorem, & L'Hopital",
        tasks: [
          "Review the formal definition of derivative and differentiability proofs.",
          "Practice Mean Value Theorem problems (proving existences of derivative points).",
          "Work through indeterminate forms (0^0, inf^0, 1^inf) using L'Hopital's rule."
        ]
      },
      {
        day: 4,
        focus: "Taylor Polynomials & Remainder Estimations",
        tasks: [
          "Write standard Taylor expansions for e^x, sin(x), cos(x), and ln(1+x).",
          "Practice calculating Lagrange Remainder error bounds for approximations.",
          "Determine the degree needed to approximate sin(0.1) within 10^-6."
        ]
      },
      {
        day: 5,
        focus: "Sequences & Basic Series Tests",
        tasks: [
          "Study bounded and monotone sequences and squeeze theorem applications.",
          "Practice Divergence, Integral, and basic Comparison tests on series.",
          "Differentiate between series terms going to zero vs series convergence."
        ]
      },
      {
        day: 6,
        focus: "Advanced Convergence Tests & Power Series",
        tasks: [
          "Practice Ratio and Root tests for absolute convergence.",
          "Determine interval and radius of convergence for 5 different power series.",
          "Complete the MATH 137 practice quiz to identify weak areas."
        ]
      },
      {
        day: 7,
        focus: "Review Weak Spots & Concept Map",
        tasks: [
          "Review the Weak Spots tab, looking particularly at Lagrange estimations.",
          "Go through the active recall cards twice.",
          "Get plenty of sleep prior to the calculus exam."
        ]
      }
    ],
    weakSpots: [
      {
        concept: "Differentiating Continuity vs Uniform Continuity",
        coverage: "Not detailed in standard slides but mentioned in syllabus as a prerequisite for rigorous proofs.",
        action: "Look up definitions and read about how Uniform Continuity depends on the interval rather than just the points.",
        source: "Syllabus Appendix A"
      },
      {
        concept: "Taylor Error Bounds on Alternating Series",
        coverage: "Covered in Slide 12 but easily confused with Lagrange Remainder.",
        action: "Review how for alternating series, the error is simply bounded by the first omitted term, which is much simpler than Lagrange.",
        source: "Lecture Notes 12"
      }
    ]
  },
  "ECON101": {
    courseCode: "ECON 101",
    courseName: "Introduction to Microeconomics",
    university: "University of Waterloo",
    summary: "ECON 101 introduces students to the principles of economics, focusing on microeconomic topics: consumer behavior, market demand and supply, elasticities, taxation, production cost structures, and different market competitiveness (monopoly, oligopoly, perfect competition).",
    courseMap: [
      {
        week: "Weeks 1-2",
        topic: "Core Principles & Demand/Supply",
        concepts: ["Opportunity Cost", "Comparative Advantage", "Law of Demand/Supply", "Market Equilibrium"],
        weight: "15% of Exam",
        source: "Syllabus Unit 1"
      },
      {
        week: "Weeks 3-4",
        topic: "Elasticity & Government Policies",
        concepts: ["Price Elasticity of Demand/Supply", "Tax Incidence", "Price ceilings and floors", "Consumer/Producer Surplus"],
        weight: "20% of Exam",
        source: "Syllabus Unit 2 & Slides 4-6"
      },
      {
        week: "Weeks 5-7",
        topic: "Consumer Choice & Production Costs",
        concepts: ["Utility maximization", "Marginal Utility", "Fixed vs Variable Costs", "ATC, AVC, MC curves"],
        weight: "25% of Exam",
        source: "Syllabus Unit 3 & Slides 8-11"
      },
      {
        week: "Weeks 8-10",
        topic: "Market Structures",
        concepts: ["Perfect Competition", "Monopoly (price discrimination)", "Monopolistic Competition", "Oligopoly (Game theory, Nash Equilibrium)"],
        weight: "30% of Exam",
        source: "Syllabus Unit 4 & Slides 13-17"
      },
      {
        week: "Weeks 11-12",
        topic: "Market Failures & Externalities",
        concepts: ["Negative/Positive externalities", "Coase Theorem", "Public goods", "Common resources"],
        weight: "10% of Exam",
        source: "Syllabus Unit 5 & Slides 19-20"
      }
    ],
    examFocus: [
      {
        concept: "Calculating Tax Incidence and Deadweight Loss",
        importance: "High",
        explanation: "The exam will require you to calculate equilibrium before and after a tax, determine the tax burden borne by consumers vs producers, and calculate the resulting deadweight loss.",
        likelyQuestion: "Given demand Q = 100 - P and supply Q = 2P, a tax of $3 per unit is imposed on sellers. Find the new buyer price, seller price, quantity sold, tax revenue, and Deadweight Loss.",
        tips: "Set P_D - P_S = Tax. Substitute equations into the equilibrium condition Q_D(P_D) = Q_S(P_S) to solve for prices. Draw the surplus triangles to find DWL = 0.5 * Tax * (Q_old - Q_new).",
        source: "Unit 2 Study Guide"
      },
      {
        concept: "Cost Curves Relationships",
        importance: "High",
        explanation: "Understanding how MC crosses ATC and AVC at their minimum points is critical. You must be able to calculate cost tables (TC, VC, FC, ATC, AVC, MC) and find profit-maximizing output where P = MC.",
        likelyQuestion: "Explain why the Marginal Cost curve always intersects the Average Total Cost curve at its minimum point.",
        tips: "If marginal cost is below average cost, it pulls average cost down. If marginal cost is above average cost, it pulls it up. Therefore, they must cross when average cost is flat (its minimum).",
        source: "Slides: Lecture 10"
      },
      {
        concept: "Monopoly vs Perfect Competition Welfare",
        importance: "Medium",
        explanation: "Comparing output levels and economic surplus. Monopolies produce less and charge more, creating deadweight loss compared to perfectly competitive markets.",
        likelyQuestion: "Graphically show the consumer surplus, producer surplus, and deadweight loss of a single-price monopolist. Identify the profit-maximizing point where MR = MC.",
        tips: "Monopoly marginal revenue (MR) has twice the slope of the demand curve. Find quantity where MR = MC, then go up to the demand curve to find the price.",
        source: "Slides: Lecture 14"
      }
    ],
    definitions: [
      {
        term: "Opportunity Cost",
        definition: "The loss of potential gain from other alternatives when one alternative is chosen. The value of the next-best alternative foregone.",
        confusionPoint: "Includes both explicit out-of-pocket costs and implicit costs (like value of time or foregone wages).",
        source: "Slides: Lecture 1"
      },
      {
        term: "Price Elasticity of Demand",
        definition: "A measure of the responsiveness of the quantity demanded of a good to a change in its price.",
        formula: "E_d = \\frac{\\% \\Delta Q_d}{\\% \\Delta P}",
        confusionPoint: "Elasticity changes along a linear demand curve. It is elastic at high prices, unit elastic at the midpoint, and inelastic at low prices.",
        source: "Slides: Lecture 4, Page 2"
      },
      {
        term: "Deadweight Loss",
        definition: "The fall in total surplus (consumer + producer) that results from a market distortion, such as a tax or monopoly pricing.",
        confusionPoint: "It represents transactions that would have benefited both buyers and sellers but do not occur due to the distortion.",
        source: "Slides: Lecture 6, Page 12"
      },
      {
        term: "Nash Equilibrium",
        definition: "A situation in game theory where each player chooses their optimal strategy, given the strategies chosen by the other players, leaving no incentive to deviate.",
        confusionPoint: "A Nash equilibrium does not mean the joint-best outcome (e.g., Prisoners' Dilemma ends in dominant strategy equilibrium that is suboptimal for both).",
        source: "Slides: Lecture 17, Page 7"
      }
    ],
    activeRecall: [
      {
        question: "How does the price elasticity of demand influence who bears the burden of a sales tax?",
        answer: "The tax burden falls more heavily on the side of the market that is less elastic (more price-insensitive). If demand is inelastic relative to supply (like insulin or cigarettes), consumers cannot easily substitute away, so they bear most of the tax. If supply is inelastic relative to demand, producers bear the majority.",
        hint: "Elasticity represents flexibility. The less flexible side pays more.",
        source: "Slides: Lecture 5, Page 15"
      },
      {
        question: "What is the shutdown rule for a competitive firm in the short run?",
        answer: "A firm should shut down in the short run if the market price falls below its minimum Average Variable Cost (AVC) at the profit-maximizing output (P < AVC). If P > AVC but P < ATC, the firm should continue operating in the short run at a loss, because it can still cover some of its fixed costs.",
        hint: "Think about which costs are sunk in the short run (Fixed Costs).",
        source: "Slides: Lecture 11, Page 18"
      },
      {
        question: "What is the difference between a public good and a common resource?",
        answer: "A public good is both non-excludable (cannot prevent people from using it) and non-rivalrous (one person's use does not diminish another's, e.g., national defense). A common resource is non-excludable but rivalrous (one person's consumption reduces availability for others, e.g., fish stocks in the ocean, leading to the Tragedy of the Commons).",
        hint: "Compare excludability and rivalrousness.",
        source: "Slides: Lecture 19, Page 4"
      }
    ],
    quiz: [
      {
        id: 1,
        question: "If the cross-price elasticity of demand between Good X and Good Y is -1.5, what is the relationship between the two goods?",
        options: [
          "They are substitutes.",
          "They are complements.",
          "They are normal goods.",
          "They are inferior goods."
        ],
        correctAnswer: 1,
        explanation: "Cross-price elasticity measures how quantity demanded of one good reacts to price changes of another. A negative value means an increase in the price of Good Y leads to a decrease in the quantity of Good X. Thus, they are consumed together (complements).",
        source: "Lecture Slides 4, Page 22"
      },
      {
        id: 2,
        question: "In a perfectly competitive market, what is the long-run economic profit of a firm?",
        options: [
          "Positive economic profit.",
          "Zero economic profit.",
          "Negative economic profit.",
          "Depends on the size of the firm."
        ],
        correctAnswer: 1,
        explanation: "In perfect competition, there are no barriers to entry or exit. If firms earn positive economic profits, new firms enter, increasing supply and lowering price. If they make losses, firms exit, raising price. Equilibrium is reached when economic profit is zero (P = minimum ATC).",
        source: "Lecture Slides 11, Page 30"
      },
      {
        id: 3,
        question: "Which of the following is an example of a Pigouvian tax?",
        options: [
          "A tax on income to fund public schools.",
          "A tax on gasoline to reduce carbon emissions.",
          "An import tariff on foreign cars.",
          "A property tax on residential housing."
        ],
        correctAnswer: 1,
        explanation: "A Pigouvian tax is a tax levied on market activities that generate negative externalities (like carbon pollution). It is designed to make the private cost equal to the social cost, aligning private incentives with social welfare.",
        source: "Lecture Slides 19, Page 18"
      }
    ],
    sevenDayPlan: [
      {
        day: 1,
        focus: "Fundamentals: Opportunity Cost & Supply/Demand",
        tasks: [
          "Practice production possibility frontier graphs and comparative advantage tables.",
          "Draw supply and demand shifts and solve for equilibrium price/quantity algebraically.",
          "Review Syllabus Unit 1 learning objectives."
        ]
      },
      {
        day: 2,
        focus: "Elasticities & Calculations",
        tasks: [
          "Memorize formulas for Price, Income, and Cross-Price Elasticity.",
          "Calculate elasticities using the midpoint method.",
          "Understand relationship between price elasticity and total revenue."
        ]
      },
      {
        day: 3,
        focus: "Surplus, Price Controls, and Taxation",
        tasks: [
          "Graph consumer and producer surplus and calculate areas.",
          "Solve tax incidence problems (buyer price vs seller price).",
          "Calculate deadweight loss resulting from tariffs or quotas."
        ]
      },
      {
        day: 4,
        focus: "Consumer Utility & Theory of Cost",
        tasks: [
          "Practice utility maximization problems (MU_x/P_x = MU_y/P_y).",
          "Memorize cost equations: TC = TFC + TVC, ATC = TC/Q, MC = dTC/dQ.",
          "Draw the cost curves (ATC, AVC, MC) and label minimums."
        ]
      },
      {
        day: 5,
        focus: "Perfect Competition & Monopolies",
        tasks: [
          "Review competitive firm short-run shutdown vs long-run exit conditions.",
          "Draw monopoly pricing graphs showing MR, MC, Demand, and profits.",
          "Compare efficiency and deadweight loss of competitive vs monopoly markets."
        ]
      },
      {
        day: 6,
        focus: "Oligopoly, Game Theory, & Externalities",
        tasks: [
          "Solve 2x2 game matrices to find dominant strategies and Nash Equilibria.",
          "Understand positive/negative externalities and graphical Pigouvian corrective policies.",
          "Take the ECON 101 quiz and review questions missed."
        ]
      },
      {
        day: 7,
        focus: "Final Graph Review & Concept Polish",
        tasks: [
          "Redraw all 8 major market structures and cost curves from memory.",
          "Scan the Weak Spots tab for any final confusions.",
          "Relax and get ready for the multiple-choice final."
        ]
      }
    ],
    weakSpots: [
      {
        concept: "Income and Substitution Effects for Inferior Goods",
        coverage: "Detail is light in Unit 3 slides, but tested on past exams.",
        action: "Review how for inferior goods, a price increase reduces real income, causing an income effect that pushes quantity up, partially offsetting the substitution effect.",
        source: "Unit 3 Textbook Reading"
      },
      {
        concept: "Natural Monopoly Regulation",
        coverage: "Slides cover this briefly, but details on average-cost pricing vs marginal-cost pricing are important.",
        action: "Study how marginal cost pricing requires government subsidies because MC < ATC for a natural monopoly, leading to losses.",
        source: "Lecture Slides 15"
      }
    ]
  },
  "PSYCH101": {
    courseCode: "PSYCH 101",
    courseName: "Introductory Psychology",
    university: "University of Waterloo",
    summary: "PSYCH 101 is a broad survey of the scientific study of behavior and mental processes. Key domains include neuroscience (neurons, brain anatomy), sensation and perception, learning theories (classical and operant conditioning), memory models, developmental psychology, and psychological disorders.",
    courseMap: [
      {
        week: "Weeks 1-2",
        topic: "Research Methods & Biological Psychology",
        concepts: ["Experimental design", "Structure of a Neuron", "Action Potential", "Brain lobes and functions"],
        weight: "20% of Exam",
        source: "Syllabus Part 1"
      },
      {
        week: "Weeks 3-5",
        topic: "Sensation, Perception & Consciousness",
        concepts: ["Rods vs Cones", "Visual pathway", "Gestalt principles", "Sleep stages"],
        weight: "20% of Exam",
        source: "Syllabus Part 2 & Slides 5-8"
      },
      {
        week: "Weeks 6-8",
        topic: "Learning & Memory Models",
        concepts: ["Classical Conditioning", "Operant Conditioning (schedules)", "Sensory/Short-term/Long-term memory", "Forgetting mechanisms"],
        weight: "30% of Exam",
        source: "Syllabus Part 3 & Slides 10-14"
      },
      {
        week: "Weeks 9-12",
        topic: "Cognition, Development & Disorders",
        concepts: ["Heuristics & Biases", "Piaget's Cognitive Stages", "DSM-5 classifications", "Therapeutic approaches"],
        weight: "30% of Exam",
        source: "Syllabus Part 4 & Slides 16-21"
      }
    ],
    examFocus: [
      {
        concept: "The Action Potential Transmission",
        importance: "High",
        explanation: "You must know the step-by-step electrical and chemical processes of a neuron firing, including threshold, depolarization (sodium influx), repolarization (potassium efflux), and hyperpolarization.",
        likelyQuestion: "Describe the state of sodium and potassium channels during the depolarization and repolarization phases of an action potential.",
        tips: "Depolarization is sodium (Na+) channels opening, letting positive ions in. Repolarization is sodium channels closing and potassium (K+) channels opening, letting positive ions out. Remember the sodium-potassium pump restores resting potential (-70mV) afterwards.",
        source: "Biological Foundations Slide 8"
      },
      {
        concept: "Schedules of Reinforcement (Operant Conditioning)",
        importance: "High",
        explanation: "Differentiating between ratio/interval and fixed/variable reinforcement schedules. Questions will present real-world examples and ask you to identify the schedule.",
        likelyQuestion: "A slot machine pays out after a random number of pulls. What schedule of reinforcement is this?",
        tips: "Ratio is based on number of behaviors. Interval is based on time elapsed. Fixed means predictable. Variable means unpredictable. Slot machines are Variable Ratio, which produces the highest, most persistent rate of response.",
        source: "Learning Slides 12"
      },
      {
        concept: "Piaget's Stages of Cognitive Development",
        importance: "Medium",
        explanation: "Understanding key milestones: Sensorimotor (object permanence), Preoperational (egocentrism, conservation failure), Concrete Operational (conservation achieved), Formal Operational (abstract logic).",
        likelyQuestion: "A child thinks that pouring water from a short fat glass into a tall thin glass creates more water. Which Piagetian stage is this child in?",
        tips: "Preoperational stage. They fail the conservation task because they focus on a single dimension (height), known as centration.",
        source: "Developmental Psych Slide 17"
      }
    ],
    definitions: [
      {
        term: "Action Potential",
        definition: "A brief electrical charge that travels down an axon when a neuron fires, caused by the movement of ions across the membrane.",
        confusionPoint: "The 'all-or-none' response means a stronger stimulus doesn't make a larger action potential; it just makes neurons fire more frequently.",
        source: "Slides: Biological Foundations, Page 6"
      },
      {
        term: "Classical Conditioning",
        definition: "A learning process where a neutral stimulus becomes associated with an unconditioned stimulus, eventually triggering a conditioned response.",
        confusionPoint: "Distinguishing between the Conditioned Stimulus (CS) and Unconditioned Stimulus (UCS). The CS is learned (e.g. Pavlov's bell), while UCS is natural (e.g. food).",
        source: "Slides: Learning, Page 3"
      },
      {
        term: "Object Permanence",
        definition: "The cognitive awareness that objects continue to exist even when they are out of sight, typically developing in infancy around 8 months.",
        confusionPoint: "Piaget believed this develops in the Sensorimotor stage, but modern studies show infants understand object persistence much earlier.",
        source: "Slides: Development, Page 9"
      },
      {
        term: "Confirmation Bias",
        definition: "The tendency to search for, interpret, and recall information in a way that confirms one's preexisting beliefs or hypotheses.",
        confusionPoint: "Different from Hindsight Bias ('I knew it all along'). Confirmation bias operates while gathering and evaluating new data.",
        source: "Slides: Cognition, Page 12"
      }
    ],
    activeRecall: [
      {
        question: "Explain the difference between positive reinforcement, negative reinforcement, positive punishment, and negative punishment.",
        answer: "Reinforcement increases behavior; punishment decreases behavior. Positive involves adding a stimulus; negative involves removing a stimulus. Positive Reinforcement: Add pleasant stimulus (give a treat). Negative Reinforcement: Remove unpleasant stimulus (stop nagging). Positive Punishment: Add unpleasant stimulus (yelling). Negative Punishment: Remove pleasant stimulus (take away phone).",
        hint: "Break it down: positive/negative (add/remove) and reinforcement/punishment (increase/decrease).",
        source: "Slides: Learning, Page 15"
      },
      {
        question: "What is the role of the hippocampus in memory?",
        answer: "The hippocampus is crucial for consolidating information from short-term memory to long-term memory, particularly for explicit/declarative memories (facts and events). Damage to the hippocampus results in anterograde amnesia (inability to form new long-term memories), while implicit procedural memories (like riding a bike) remain intact.",
        hint: "Think of it as a routing station for long-term storage.",
        source: "Slides: Memory, Page 22"
      },
      {
        question: "Describe the difference between rods and cones in the retina.",
        answer: "Rods are highly sensitive to light, function well in dim illumination, do not detect color, and are located in the periphery of the retina. Cones are less sensitive to light, require bright illumination, detect fine detail and colors (red, green, blue), and are concentrated in the fovea (center of the retina).",
        hint: "Rods for night/periphery; cones for color/detail.",
        source: "Slides: Sensation & Perception, Page 14"
      }
    ],
    quiz: [
      {
        id: 1,
        question: "A researcher wants to study the effects of sleep deprivation on exam performance. Group A sleeps 8 hours, and Group B sleeps 3 hours. Both groups take the same exam. What is the independent variable?",
        options: [
          "Exam performance.",
          "Amount of sleep.",
          "The difficulty of the exam.",
          "The baseline intelligence of the students."
        ],
        correctAnswer: 1,
        explanation: "The independent variable is the factor manipulated by the researcher (amount of sleep). The dependent variable is the factor measured (exam performance).",
        source: "Research Methods Slides, Page 18"
      },
      {
        id: 2,
        question: "Which brain structure is primarily responsible for regulating vital functions such as breathing, heart rate, and blood pressure?",
        options: [
          "Amydgala",
          "Hippocampus",
          "Medulla",
          "Cerebellum"
        ],
        correctAnswer: 2,
        explanation: "The medulla (located in the brainstem) controls autonomic, life-sustaining functions. Damage to the medulla is typically fatal. The cerebellum handles coordination, while amygdala processes emotion.",
        source: "Biological Foundations Slides, Page 26"
      },
      {
        id: 3,
        question: "In Pavlov's classical conditioning experiments with dogs, what was the salivation in response to the bell after conditioning?",
        options: [
          "Unconditioned Stimulus (UCS)",
          "Unconditioned Response (UCR)",
          "Conditioned Stimulus (CS)",
          "Conditioned Response (CR)"
        ],
        correctAnswer: 3,
        explanation: "Before conditioning, salivation in response to food is the Unconditioned Response (UCR). After conditioning, the bell is the Conditioned Stimulus (CS), and salivation in response to the bell alone is the Conditioned Response (CR).",
        source: "Learning Slides, Page 8"
      }
    ],
    sevenDayPlan: [
      {
        day: 1,
        focus: "Research Methods & Basic Statistics",
        tasks: [
          "Review correlations vs experimental designs (causation).",
          "Practice identifying independent, dependent, and confounding variables.",
          "Review mean, median, mode, and standard deviation distributions."
        ]
      },
      {
        day: 2,
        focus: "Biological Psychology & Neuroscience",
        tasks: [
          "Draw and label a neuron, tracing the direction of electrical signals.",
          "Memorize the action potential ion movements (sodium/potassium).",
          "Map the functions of the cerebral cortex lobes: frontal, parietal, occipital, temporal."
        ]
      },
      {
        day: 3,
        focus: "Sensation & Perception Mechanisms",
        tasks: [
          "Compare rods vs cones and study the visual pathway to the occipital lobe.",
          "Review hearing mechanisms (cochlea and hair cells).",
          "Review Gestalt principles of grouping (proximity, similarity, closure)."
        ]
      },
      {
        day: 4,
        focus: "Classical & Operant Conditioning Theories",
        tasks: [
          "Define CS, UCS, CR, and UCR for 5 different conditioning scenarios.",
          "Practice classifying positive/negative reinforcements and punishments.",
          "Memorize the reinforcement schedules and their response curves."
        ]
      },
      {
        day: 5,
        focus: "Memory Systems & Cognitive Biases",
        tasks: [
          "Study the Atkinson-Shiffrin model (Sensory, Short-Term, Long-Term).",
          "Differentiate between proactive and retroactive interference.",
          "Review cognitive heuristics (availability, representativeness) and biases."
        ]
      },
      {
        day: 6,
        focus: "Developmental Stages & Psychopathology",
        tasks: [
          "List Piaget's stages of cognitive development and their respective markers.",
          "Review Erikson's psychosocial stages of conflict.",
          "Read DSM-5 classifications for Anxiety, Depressive, and Schizophrenic disorders."
        ]
      },
      {
        day: 7,
        focus: "Active Recall Practice & Vocabulary Review",
        tasks: [
          "Go through the PSYCH 101 flashcards and active recall deck twice.",
          "Test yourself with the practice quiz.",
          "Ensure you get a good night's sleep to optimize memory consolidation."
        ]
      }
    ],
    weakSpots: [
      {
        concept: "Weber's Law Calculations",
        coverage: "Not in slides, but syllabus lists it as an examinable concept.",
        action: "Review the formula Delta I / I = k. Practice solving for Just Noticeable Difference (JND) with different constants.",
        source: "Syllabus Appendix B"
      },
      {
        concept: "Limbic System Substructures",
        coverage: "Slides combine this as emotional center, but exam requires identifying specific functions of thalamus, hypothalamus, amygdala, and hippocampus.",
        action: "Create a visual cheat sheet mapping these structures to their functional niches (e.g. thalamus = sensory relay).",
        source: "Lecture Slides 6"
      }
    ]
  }
};
