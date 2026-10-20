import { auth, db } from '../firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getAuthHeaders } from './authSession';
import { Assignment, Attempt, Lesson, LessonVersion, MistakeInsight } from '../types';

/**
 * Unified Data Service for THÁM TỬ TOÁN NHÍ
 *
 * Implements a Dual-Path Data Access Strategy:
 * 1. If Firebase Auth is active (auth.currentUser != null), performs direct Firestore operations.
 * 2. If Firebase Auth is unauthenticated or encounters PERMISSION_DENIED (e.g. strict rules on Cloud without custom token),
 *    automatically and transparently falls back to authenticated backend API proxy endpoints.
 *
 * This completely resolves the P0-A architecture conflict (HMAC Session vs Firestore Rules)
 * and guarantees uninterrupted functionality for Student, Teacher, and Admin roles.
 */

export const dataService = {
  // --- 1. STUDENT OPERATIONS ---

  async fetchStudentAssignments(classId: string): Promise<Assignment[]> {
    // Attempt 1: Direct Firestore SDK (if client has Firebase Auth session)
    if (auth.currentUser) {
      try {
        const q = query(collection(db, 'assignments'), where('classId', '==', classId));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    // Attempt 2: Authenticated Backend API Proxy
    const res = await fetch(`/api/student/assignments?classId=${encodeURIComponent(classId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải danh sách bài tập được giao.');
    }
    const data = await res.json();
    return data.assignments || [];
  },

  async fetchStudentAttempts(studentId: string): Promise<Attempt[]> {
    if (auth.currentUser) {
      try {
        const q = query(collection(db, 'attempts'), where('studentId', '==', studentId));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt));
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/student/attempts?studentId=${encodeURIComponent(studentId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải lịch sử bài làm.');
    }
    const data = await res.json();
    return data.attempts || [];
  },

  async fetchLessonVersion(versionId: string): Promise<LessonVersion> {
    if (auth.currentUser) {
      try {
        const vDoc = await getDoc(doc(db, 'lessonVersions', versionId));
        if (vDoc.exists()) {
          return { id: vDoc.id, ...vDoc.data() } as LessonVersion;
        }
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/student/lesson-version/${encodeURIComponent(versionId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải nội dung câu hỏi bài học.');
    }
    const data = await res.json();
    return data.lessonVersion;
  },

  async createAttempt(attemptDoc: Attempt): Promise<void> {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'attempts', attemptDoc.id), attemptDoc);
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch('/api/student/attempts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attemptDoc),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khởi tạo lượt làm bài.');
    }
  },

  async saveAttemptAnswer(answerDoc: any): Promise<void> {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'attemptAnswers', answerDoc.id), answerDoc);
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/student/attempts/${encodeURIComponent(answerDoc.attemptId)}/answer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(answerDoc),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi lưu câu trả lời.');
    }
  },

  async completeAttempt(attemptId: string, updates: Partial<Attempt>): Promise<void> {
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'attempts', attemptId), updates);
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/student/attempts/${encodeURIComponent(attemptId)}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi hoàn thành bài làm.');
    }
  },

  async saveMistakeInsight(insightDoc: MistakeInsight): Promise<void> {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'mistakeInsights', insightDoc.id), insightDoc);
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch('/api/student/mistake-insights', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(insightDoc),
    });
    if (!res.ok) {
      console.warn('Backend proxy save mistake insight failed, continue gameplay');
    }
  },

  // --- 2. TEACHER OPERATIONS ---

  async fetchTeacherClasses(teacherId: string): Promise<any[]> {
    if (auth.currentUser) {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        const allClasses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return allClasses.filter((c: any) => !teacherId || c.teacherId === teacherId);
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/teacher/classes?teacherId=${encodeURIComponent(teacherId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải danh sách lớp học.');
    }
    const data = await res.json();
    return data.classes || [];
  },

  async fetchTeacherLessons(): Promise<Lesson[]> {
    if (auth.currentUser) {
      try {
        const snap = await getDocs(collection(db, 'lessons'));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson));
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch('/api/teacher/lessons', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải thư viện bài học.');
    }
    const data = await res.json();
    return data.lessons || [];
  },

  async fetchTeacherAssignments(teacherId: string): Promise<Assignment[]> {
    if (auth.currentUser) {
      try {
        const snap = await getDocs(collection(db, 'assignments'));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
        return all.filter((a) => !teacherId || a.teacherId === teacherId);
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/teacher/assignments?teacherId=${encodeURIComponent(teacherId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải danh sách bài tập đã giao.');
    }
    const data = await res.json();
    return data.assignments || [];
  },

  async saveAssignment(assignmentDoc: Assignment): Promise<void> {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'assignments', assignmentDoc.id), assignmentDoc, { merge: true });
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch('/api/teacher/assignments', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignmentDoc),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi lưu bài tập.');
    }
  },

  async saveLessonVersion(lessonDoc: Lesson, versionDoc: LessonVersion): Promise<void> {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'lessonVersions', versionDoc.id), versionDoc);
        await setDoc(doc(db, 'lessons', lessonDoc.id), lessonDoc, { merge: true });
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch('/api/teacher/lessons', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lessonDoc, versionDoc }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi lưu bài học mới.');
    }
  },

  async fetchTeacherAnalytics(teacherId: string): Promise<{ attempts: Attempt[]; insights: MistakeInsight[] }> {
    if (auth.currentUser) {
      try {
        const attSnap = await getDocs(collection(db, 'attempts'));
        const insSnap = await getDocs(collection(db, 'mistakeInsights'));
        return {
          attempts: attSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt)),
          insights: insSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MistakeInsight)),
        };
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/teacher/analytics?teacherId=${encodeURIComponent(teacherId)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải số liệu phân tích lỗi sai.');
    }
    const data = await res.json();
    return {
      attempts: data.attempts || [],
      insights: data.insights || [],
    };
  },

  // --- 3. ADMIN OPERATIONS ---

  async fetchAdminOverview(): Promise<any> {
    if (auth.currentUser) {
      try {
        const [uSnap, cSnap, ySnap, lSnap, aSnap, attSnap, logSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'classes')),
          getDocs(collection(db, 'academicYears')),
          getDocs(collection(db, 'lessons')),
          getDocs(collection(db, 'assignments')),
          getDocs(collection(db, 'attempts')),
          getDocs(collection(db, 'auditLogs')),
        ]);
        return {
          users: uSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          classes: cSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          academicYears: ySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          lessons: lSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          assignments: aSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          attempts: attSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          auditLogs: logSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        };
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch('/api/admin/overview', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Không thể tải dữ liệu quản trị.');
    }
    return await res.json();
  },

  async adminCreateUser(newUser: any): Promise<void> {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', newUser.id), newUser);
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(newUser),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi tạo người dùng mới.');
    }
  },

  async adminDeleteUser(userId: string): Promise<void> {
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi xóa người dùng.');
    }
  },

  async adminUpdateUser(userId: string, updates: any): Promise<void> {
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', userId), updates);
        return;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi cập nhật người dùng.');
    }
  },
};
