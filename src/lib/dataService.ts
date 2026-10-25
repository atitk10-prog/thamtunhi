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
import { Assignment, Attempt, Lesson, LessonVersion, MistakeInsight, UserProfile, UserAccountStatus, MediaItem, MediaCategory } from '../types';
import { searchStandardAssets } from './standardAssets';

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

  async fetchStudentAssignments(classId: string, studentId?: string): Promise<Assignment[]> {
    if (!classId) {
      throw new Error('Chưa có thông tin lớp học để tải bài tập.');
    }

    let url = `/api/student/assignments?classId=${encodeURIComponent(classId)}`;
    if (studentId) {
      url += `&studentId=${encodeURIComponent(studentId)}`;
    }

    // Attempt 1: Direct Firestore SDK (if client has Firebase Auth session)
    if (auth.currentUser) {
      try {
        const q = query(collection(db, 'assignments'), where('classId', '==', classId));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assignment));
        if (studentId) {
          return list.filter((a) => !a.studentId || a.studentId === studentId);
        }
        return list;
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }

    // Attempt 2: Authenticated Backend API Proxy
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể tải danh sách bài tập được giao.');
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
    try {
      const res = await fetch(`/api/teacher/classes?teacherId=${encodeURIComponent(teacherId)}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return data.classes || [];
      }
    } catch (apiErr) {
      console.warn('API fetchTeacherClasses fallback to client SDK:', apiErr);
    }

    if (auth.currentUser) {
      try {
        const [snap, uSnap] = await Promise.all([
          getDocs(collection(db, 'classes')),
          getDocs(collection(db, 'users')),
        ]);
        const users = uSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const allClasses = snap.docs.map((d) => {
          const cData: any = d.data();
          const studentCount = users.filter(
            (u: any) => u.role === 'student' && !u.isDeleted && (u.classId === d.id || u.className === cData.name || u.classId === cData.name)
          ).length;
          return { id: d.id, ...cData, studentCount };
        });
        return allClasses.filter((c: any) => !teacherId || c.teacherId === teacherId);
      } catch (err: any) {
        if (!err?.message?.includes('permission-denied') && !err?.code?.includes('permission-denied')) {
          throw err;
        }
      }
    }
    return [];
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

  async saveAssignment(assignmentDoc: Partial<Assignment> & { allowReassign?: boolean }): Promise<Assignment> {
    const res = await fetch('/api/teacher/assignments', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(assignmentDoc),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorObj = new Error(err.error || 'Lỗi lưu bài tập.');
      (errorObj as any).code = err.code;
      (errorObj as any).existingAssignment = err.existingAssignment;
      throw errorObj;
    }
    const data = await res.json();
    return data.assignment;
  },

  async updateTeacherProfile(displayName: string, phone?: string): Promise<any> {
    const res = await fetch('/api/teacher/profile', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ displayName, phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi cập nhật hồ sơ giáo viên.');
    }
    return res.json();
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

  // --- MEDIA LIBRARY OPERATIONS (P0) ---

  async fetchMediaLibrary(category?: string, search?: string): Promise<MediaItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search && search.trim()) params.set('search', search.trim());

    const url = `/api/teacher/media${params.toString() ? `?${params.toString()}` : ''}`;
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          return data.items;
        }
      }
    } catch (err) {
      console.warn('Notice: API media fetch notice, falling back to standard math assets:', err);
    }

    return searchStandardAssets(category, search);
  },

  async uploadMedia(data: {
    title: string;
    category: MediaCategory;
    description?: string;
    base64Data: string;
    mimeType: string;
    width: number;
    height: number;
  }): Promise<MediaItem> {
    const res = await fetch('/api/teacher/media/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi tải ảnh lên thư viện.');
    }
    const result = await res.json();
    return result.media;
  },

  async deleteMedia(id: string): Promise<any> {
    const res = await fetch(`/api/teacher/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorObj = new Error(err.error || 'Lỗi xóa hình ảnh.');
      (errorObj as any).code = err.code;
      (errorObj as any).referencingLessons = err.referencingLessons;
      throw errorObj;
    }
    return res.json();
  },

  /**
   * Client-side image compression helper:
   * - Restricts accepted types: JPG, JPEG, PNG, WebP (< 1,000,000 bytes)
   * - Proportional scaling keeping aspect ratio (không méo hình)
   * - Prefers WebP for compact size; preserves PNG if alpha channel transparency is detected
   * - Rejects dangerous/unsupported files (SVG, HTML, etc.)
   */
  async compressImageClient(
    file: File,
    options: { maxWidth?: number; maxHeight?: number; maxBytes?: number } = {}
  ): Promise<{
    blob: Blob;
    base64: string;
    mimeType: string;
    sizeBytes: number;
    width: number;
    height: number;
  }> {
    const maxBytes = options.maxBytes ?? 1_000_000; // 1 MB limit
    const maxWidth = options.maxWidth ?? 1200;
    const maxHeight = options.maxHeight ?? 1200;

    const lowerName = file.name.toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || lowerName.endsWith('.svg');
    const isHtml = file.type === 'text/html' || lowerName.endsWith('.html') || lowerName.endsWith('.htm');
    if (isSvg || isHtml) {
      throw new Error('Định dạng tệp không được hỗ trợ vì lý do bảo mật. Vui lòng chọn ảnh JPG, JPEG, PNG hoặc WebP.');
    }

    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type) && !acceptedTypes.some((t) => lowerName.endsWith(t.replace('image/', '')))) {
      throw new Error('Định dạng tệp không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG hoặc WebP.');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        try {
          let origWidth = img.naturalWidth || img.width;
          let origHeight = img.naturalHeight || img.height;

          if (!origWidth || !origHeight) {
            reject(new Error('Không thể đọc kích thước tệp ảnh.'));
            return;
          }

          // Compute scale keeping aspect ratio intact (không méo hình)
          let targetWidth = origWidth;
          let targetHeight = origHeight;
          if (targetWidth > maxWidth || targetHeight > maxHeight) {
            const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Trình duyệt không hỗ trợ xử lý hình ảnh (Canvas 2D).'));
            return;
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Detect alpha transparency for PNG
          let hasAlpha = false;
          if (file.type === 'image/png' || lowerName.endsWith('.png')) {
            try {
              const imgData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100)).data;
              for (let i = 3; i < imgData.length; i += 4) {
                if (imgData[i] < 250) {
                  hasAlpha = true;
                  break;
                }
              }
            } catch {
              hasAlpha = true; // Safe fallback
            }
          }

          // Choose target MIME: keep PNG if transparent, otherwise prefer WebP for best compression
          const targetMime = hasAlpha ? 'image/png' : 'image/webp';

          // Iterative compression to guarantee < 1,000,000 bytes
          let quality = 0.92;
          let currentBlob: Blob | null = null;
          let attempts = 0;

          while (attempts < 6) {
            currentBlob = await new Promise<Blob | null>((resBlob) => {
              canvas.toBlob((b) => resBlob(b), targetMime, quality);
            });

            if (currentBlob && currentBlob.size <= maxBytes) {
              break;
            }

            // Reduce quality or downscale if needed
            quality -= 0.15;
            if (quality < 0.4) {
              // Scale down dimensions by 20%
              canvas.width = Math.round(canvas.width * 0.8);
              canvas.height = Math.round(canvas.height * 0.8);
              targetWidth = canvas.width;
              targetHeight = canvas.height;
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              quality = 0.8;
            }
            attempts++;
          }

          if (!currentBlob || currentBlob.size > maxBytes) {
            reject(
              new Error(
                `Dung lượng ảnh sau khi nén (${((currentBlob?.size || file.size) / 1024 / 1024).toFixed(2)} MB) vẫn vượt quá giới hạn 1 MB (1.000.000 byte). Vui lòng chọn ảnh nhỏ hơn.`
              )
            );
            return;
          }

          // Convert to Base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve({
              blob: currentBlob!,
              base64,
              mimeType: targetMime,
              sizeBytes: currentBlob!.size,
              width: targetWidth,
              height: targetHeight,
            });
          };
          reader.onerror = () => reject(new Error('Lỗi chuyển đổi dữ liệu ảnh sang Base64.'));
          reader.readAsDataURL(currentBlob);
        } catch (err: any) {
          reject(new Error('Lỗi xử lý nén ảnh: ' + (err?.message || err)));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Không thể tải hoặc hiển thị tệp ảnh đã chọn.'));
      };

      img.src = objectUrl;
    });
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

  async fetchClassStudents(classId: string): Promise<{ class: any; students: any[]; assignments: any[] }> {
    const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classId)}/students`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể tải danh sách học sinh của lớp.');
    }
    const data = await res.json();
    return {
      class: data.class,
      students: data.students || [],
      assignments: data.assignments || [],
    };
  },

  async addStudentToClass(classId: string, studentData: { displayName: string; studentCode: string; accessSecret: string; grade?: number }): Promise<any> {
    const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classId)}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể thêm học sinh.');
    }
    return res.json();
  },

  async updateStudent(studentId: string, updates: { status?: UserAccountStatus; classId?: string; accessSecret?: string; displayName?: string }): Promise<any> {
    const res = await fetch(`/api/teacher/students/${encodeURIComponent(studentId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể cập nhật học sinh.');
    }
    return res.json();
  },

  async assignTeacherToClass(classId: string, teacherId: string): Promise<any> {
    const res = await fetch(`/api/admin/classes/${encodeURIComponent(classId)}/teacher`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ teacherId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể phân công giáo viên.');
    }
    return res.json();
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

  async fetchSystemHealth(): Promise<any> {
    const res = await fetch('/api/health');
    if (!res.ok) {
      throw new Error('Lỗi kiểm tra hệ thống.');
    }
    return await res.json();
  },

  async adminCreateUser(newUser: any): Promise<any> {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', newUser.id), newUser);
        return { success: true };
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
    return await res.json();
  },

  async adminGetUserLinkedData(userId: string): Promise<any> {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/linked-data`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi kiểm tra dữ liệu liên kết của tài khoản.');
    }
    return await res.json();
  },

  async adminDeleteUser(userId: string, archiveOnly = false): Promise<any> {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ archive: archiveOnly }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi xóa tài khoản người dùng.');
    }
    return await res.json();
  },

  async adminUpdateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
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

  async adminResetPassword(userId: string, newPassword?: string): Promise<any> {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi đặt lại mật khẩu.');
    }
    return await res.json();
  },

  async adminCreateClass(classData: {
    name: string;
    grade?: number;
    academicYearId?: string;
    teacherId?: string | null;
    status?: string;
  }): Promise<any> {
    const res = await fetch('/api/admin/classes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(classData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi tạo lớp học mới.');
    }
    return await res.json();
  },

  async adminUpdateClass(classId: string, updates: any): Promise<any> {
    const res = await fetch(`/api/admin/classes/${encodeURIComponent(classId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi cập nhật lớp học.');
    }
    return await res.json();
  },

  async adminDeleteClass(classId: string, archiveOnly = false): Promise<any> {
    const res = await fetch(`/api/admin/classes/${encodeURIComponent(classId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ archive: archiveOnly }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi xóa lớp học.');
    }
    return await res.json();
  },

  async adminAssignTeacherToClass(classId: string, teacherId: string | null): Promise<any> {
    const res = await fetch(`/api/admin/classes/${encodeURIComponent(classId)}/teacher`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ teacherId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi phân công giáo viên.');
    }
    return res.json();
  },

  async adminUnassignTeacherFromClass(classId: string): Promise<any> {
    return this.adminAssignTeacherToClass(classId, null);
  },

  async adminCreateAcademicYear(name: string, isCurrent = false): Promise<any> {
    const res = await fetch('/api/admin/academic-years', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, isCurrent }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi tạo năm học.');
    }
    return res.json();
  },

  async adminUpdateAcademicYear(yearId: string, updates: { name?: string; isCurrent?: boolean; status?: 'active' | 'archived' }): Promise<any> {
    const res = await fetch(`/api/admin/academic-years/${encodeURIComponent(yearId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi cập nhật năm học.');
    }
    return res.json();
  },

  async adminDeleteAcademicYear(yearId: string): Promise<any> {
    const res = await fetch(`/api/admin/academic-years/${encodeURIComponent(yearId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi xóa năm học.');
    }
    return res.json();
  },

  async adminChangePassword(currentPassword: string, newPassword: string): Promise<any> {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi đổi mật khẩu.');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  async adminUpdateProfile(displayName: string, email: string): Promise<any> {
    const res = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ displayName, email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi cập nhật hồ sơ.');
    }
    return res.json();
  },

  async adminGetAuditLogs(page = 1, limit = 20, action = 'all', search = ''): Promise<any> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      action,
      search,
    });
    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi tải nhật ký.');
    }
    return res.json();
  },

  async adminExportData(): Promise<any> {
    const res = await fetch('/api/admin/export', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi xuất dữ liệu.');
    }
    return res.json();
  },
};
