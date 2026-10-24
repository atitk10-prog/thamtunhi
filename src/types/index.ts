/**
 * THÁM TỬ TOÁN NHÍ - Data Types & Interfaces
 * Grade 1-2 Math Diagnostic & Visual Reinforcement Platform
 */

export type UserRole = 'admin' | 'teacher' | 'student';
export type DataOrigin = 'simulation' | 'real';
export type EnvironmentTag = 'demo' | 'production';

export interface UserProfile {
  id: string; // Auth UID
  role: UserRole;
  displayName: string;
  name?: string;
  email?: string;
  phone?: string;
  authProvider?: string;
  studentCode?: string; // For students: HS1A01, HS2B05
  accessSecretMasked?: string; // Hint for teacher roster
  classId?: string;
  className?: string;
  grade?: 1 | 2;
  schoolYearId?: string;
  academicYearId?: string;
  status?: UserAccountStatus;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export type UserAccountStatus = 'active' | 'locked' | 'inactive';

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2024 - 2025"
  isCurrent: boolean;
  status?: 'active' | 'archived';
  createdAt: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export interface Classroom {
  id: string;
  name: string; // e.g. "1A", "1B", "2A", "2B"
  grade: 1 | 2;
  academicYearId: string;
  teacherId?: string;
  teacherName?: string;
  studentCount: number;
  status?: 'active' | 'archived';
  isDeleted?: boolean;
  createdAt: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export type InteractionType =
  | 'single_choice'        // Chọn 1 đáp án trắc nghiệm hình ảnh/số
  | 'number_input'         // Nhập số trực tiếp vào ô trống
  | 'operator_pick'        // Chọn dấu phép tính (+, -, =) hoặc dấu so sánh (>, <, =)
  | 'expression_match'     // Nối/ghép cặp phép tính với kết quả
  | 'ten_frame_bundle'     // Khung 10 ô / que tính tách gộp chục - đơn vị
  | 'number_line_order';   // Trục số bước nhảy / sắp xếp thứ tự số

export type MathErrorPattern =
  | 'COUNTING_OFF_BY_ONE'           // Đếm lệch 1 (thiếu hoặc thừa)
  | 'WRONG_OPERATOR'                // Sai dấu phép tính (+ thay vì - hoặc ngược lại)
  | 'CROSS_TEN_ERROR'               // Sai bước qua 10 / nhớ sai trong cộng trừ
  | 'PLACE_VALUE_SWAP'              // Nhầm vị trí hàng chục và hàng đơn vị (vd 23 thành 32)
  | 'COMPARISON_INVERSION'          // Đảo chiều so sánh (> thay vì <)
  | 'WORD_PROBLEM_WRONG_OPERATION'  // Chọn sai phép tính trong toán lời văn
  | 'NUMBER_ORDER_CONFUSION'        // Nhầm thứ tự trước/sau trên trục số
  | 'GEOMETRY_MISIDENTIFICATION'    // Nhầm lẫn hình phẳng / hình khối
  | 'MEASUREMENT_UNIT_ERROR'        // Nhầm đơn vị đo độ dài / thời gian
  | 'GENERAL_CALCULATION_ERROR';    // Lỗi tính toán thông thường

export type MediaCategory =
  | 'items'              // Đồ vật
  | 'animals'            // Động vật
  | 'fruits'             // Hoa quả
  | 'counters_frames'    // Chấm tròn & Khung số (5 ô, 10 ô)
  | 'counting_sticks'    // Que tính & Bó que tính
  | 'geometry'           // Hình học (hình phẳng, hình khối)
  | 'clock_time'         // Đồng hồ & Thời gian
  | 'money_measurement'; // Tiền tệ & Đơn vị đo

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  category: MediaCategory;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  url: string; // /api/media/file/:id
  width?: number;
  height?: number;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
  referenceCount?: number;
}

export interface MediaUploadResponse {
  success: boolean;
  media: MediaItem;
}

export interface VisualAssetConfig {
  type: 'counters' | 'addition' | 'ten_frame' | 'five_frame' | 'bundles' | 'number_line' | 'shapes' | 'word_story' | 'comparison' | 'image' | 'money' | 'clock' | 'none';
  count?: number;
  leftCount?: number;
  rightCount?: number;
  leftLabel?: string;
  rightLabel?: string;
  iconName?: string; // apple, star, candy, fish, pencil, block, carrot, flower, bird, rabbit, orange, banana, ball, book
  tens?: number;
  ones?: number;
  min?: number;
  max?: number;
  step?: number;
  target?: number;
  storyText?: string;
  shapeType?: 'circle' | 'square' | 'triangle' | 'rectangle' | 'cylinder' | 'sphere';
  dotColor?: 'red' | 'blue' | 'green' | 'amber' | string;
  gridSize?: number; // 5, 10, 20
  layout?: 'row' | 'grid' | 'circle';
  // Money visualization (Vietnamese Currency VND)
  moneyBills?: { denomination: number; count: number }[];
  // Clock visualization (Analog clock face)
  hours?: number;
  minutes?: number;
  showDigital?: boolean;
  // Image-specific configuration for question illustrations
  imageId?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageScale?: 'small' | 'medium' | 'large' | 'full'; // small (~180px), medium (~280px), large (~380px), full (100%)
  imageAspectRatio?: 'original' | '1:1' | '4:3' | '16:9';
  imageFit?: 'contain' | 'cover';
  imageAlign?: 'center' | 'left' | 'right';
  caption?: string;
  isTeacherVerified?: boolean;
}

export interface Question {
  id: string;
  order: number;
  prompt: string; // Câu hỏi hiển thị cho học sinh (tiếng Việt)
  interactionType: InteractionType;
  visualConfig?: VisualAssetConfig;
  options?: string[]; // Cho single_choice, operator_pick
  pairs?: { left: string; right: string }[]; // Cho expression_match
  expectedAnswer: string; // Chuỗi đáp án chuẩn
  acceptableAnswers?: string[]; // Các dạng đáp án hợp lệ tương đương
  explanation: string; // Giải thích chi tiết cho giáo viên & học sinh sau làm
  skillTag: string; // e.g. "Cộng phạm vi 10", "Chục và đơn vị"
  difficulty: 'easy' | 'medium' | 'hard';
  ruleHints: {
    pattern: MathErrorPattern;
    hintText: string;
    visualActionGuidance?: string;
  }[];
}

export interface Lesson {
  id: string;
  title: string;
  grade: 1 | 2;
  topic: string;
  learningStandard: string; // Yêu cầu cần đạt GDPT 2018
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  status: 'draft' | 'published' | 'archived';
  isPublished?: boolean;
  currentVersion: number;
  currentVersionId?: string;
  draftVersionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export interface LessonVersion {
  id: string;
  lessonId: string;
  versionNumber: number;
  title: string;
  grade: 1 | 2;
  topic: string;
  learningStandard: string;
  questions: Question[];
  isPublished: boolean;
  publishedAt?: string;
  createdBy: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export interface Assignment {
  id: string;
  title: string;
  lessonId: string;
  lessonVersionId: string;
  classId: string;
  className?: string;
  studentId?: string; // Tùy chọn: Giao riêng cho từng học sinh cụ thể
  studentName?: string;
  grade: 1 | 2;
  teacherId: string;
  dueDate: string;
  status: 'open' | 'closed' | 'archived';
  academicYearId?: string;
  idempotencyKey?: string;
  createdAt: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export interface Attempt {
  id: string;
  assignmentId: string;
  lessonId: string;
  lessonVersionId: string;
  lessonTitle: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  classId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentQuestionIndex: number;
  score: number; // Thang 10 hoặc tổng điểm
  maxScore: number;
  totalQuestions?: number;
  firstAttemptCorrectCount: number;
  postHintCorrectCount: number;
  totalAttemptsMade: number;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  badgeAwarded?: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  studentId: string;
  firstGivenAnswer?: string;
  finalAnswer: string;
  isFirstAttemptCorrect: boolean;
  isFinalCorrect: boolean;
  attemptsCount: number;
  detectedErrorPattern?: MathErrorPattern;
  hintShown?: string;
  hintReinforcementType?: string;
  answeredAt: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export interface MistakeInsight {
  id: string;
  studentId?: string;
  studentName?: string;
  classId: string;
  className?: string;
  grade: 1 | 2;
  topic: string;
  errorPattern: MathErrorPattern;
  errorCount: number;
  suggestedRemediation: string;
  createdAt: string;
  dataOrigin: DataOrigin;
  environmentTag: EnvironmentTag;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole | string;
  performedBy?: string;
  targetCollection?: string;
  targetId?: string;
  targetName?: string;
  targetUserId?: string;
  classId?: string;
  teacherId?: string;
  details?: string;
  success?: boolean;
  timestamp: string;
  dataOrigin?: DataOrigin;
  environmentTag?: EnvironmentTag;
}

export type AdminTab =
  | 'overview'
  | 'users'
  | 'classes'
  | 'academic_years'
  | 'curriculum'
  | 'analytics'
  | 'data_backup'
  | 'audit_logs'
  | 'settings';

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  firebaseProjectId: string;
  databaseId: string;
  authConnected: boolean;
  geminiConfigured: boolean;
  buildVersion: string;
  environmentTag: EnvironmentTag;
  demoStats: {
    teachersCount: number;
    classesCount: number;
    studentsCount: number;
    lessonsCount: number;
    assignmentsCount: number;
    attemptsCount: number;
  };
  warnings: string[];
}
