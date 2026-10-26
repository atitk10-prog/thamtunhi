import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

import { Assignment, LessonVersion, Question, UserProfile, Attempt } from '../../types';
import { dataService } from '../../lib/dataService';
import { evaluateAnswer } from '../../lib/mathEngine';
import { playCorrectSound, playIncorrectSound, playCompletedSound, isSoundEnabled, setSoundEnabled } from '../../lib/soundEffects';
import { SingleChoiceQuestion } from '../activities/SingleChoiceQuestion';
import { NumberInputQuestion } from '../activities/NumberInputQuestion';
import { OperatorPickQuestion } from '../activities/OperatorPickQuestion';
import { ExpressionMatchQuestion } from '../activities/ExpressionMatchQuestion';
import { TenFrameBundleQuestion } from '../activities/TenFrameBundleQuestion';
import { NumberLineOrderQuestion } from '../activities/NumberLineOrderQuestion';
import { DetectiveFeedbackModal } from '../activities/DetectiveFeedbackModal';
import { CelebrationBadgeModal } from '../activities/CelebrationBadgeModal';

interface MissionPlayerProps {
  assignment: Assignment;
  lessonVersion: LessonVersion;
  currentUser: UserProfile;
  onExit: () => void;
}

export const MissionPlayer: React.FC<MissionPlayerProps> = ({
  assignment,
  lessonVersion,
  currentUser,
  onExit,
}) => {
  const questions: Question[] = lessonVersion.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sound preference state
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());

  // User input states for different question types
  const [singleChoiceAnswer, setSingleChoiceAnswer] = useState('');
  const [numberInputValue, setNumberInputValue] = useState('');
  const [operatorValue, setOperatorValue] = useState('');
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [tenFrameAnswer, setTenFrameAnswer] = useState('');
  const [numberLineAnswer, setNumberLineAnswer] = useState('');

  // Attempt lifecycle
  const [attemptId, setAttemptId] = useState<string>('');
  const [startTime] = useState<number>(Date.now());
  const [score, setScore] = useState(0);
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [postHintCount, setPostHintCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Question retry / hint state
  const [hasFailedFirstTry, setHasFailedFirstTry] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    pattern?: any;
    hintText?: string;
    visualGuidance?: string;
  }>({ isOpen: false });

  // Finished state
  const [isCompleted, setIsCompleted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Preview Mode flag (Teacher viewing curriculum without student telemetry)
  const isPreview = Boolean(
    assignment.id === 'preview-assignment' ||
    assignment.id.startsWith('preview') ||
    assignment.dataOrigin === 'simulation' ||
    currentUser.displayName?.includes('(Xem trước)') ||
    currentUser.role === 'teacher'
  );

  const currentQuestion: Question | undefined = questions[currentIndex];
  const calculatedMaxScore = questions.reduce((sum, q) => sum + (Number((q as any).points) || 10), 0) || (questions.length > 0 ? questions.length * 10 : 80);

  const cacheKey = `thamtunhi_active_mission_${assignment.id}_${currentUser.id}`;

  // Initialize or resume attempt in Firestore and session storage
  useEffect(() => {
    async function initOrResumeAttempt() {
      // 1. Try to restore in-progress state from sessionStorage (F5 preservation)
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.attemptId) {
            setAttemptId(parsed.attemptId);
            if (typeof parsed.currentIndex === 'number' && parsed.currentIndex < questions.length) {
              setCurrentIndex(parsed.currentIndex);
            }
            if (typeof parsed.score === 'number') setScore(parsed.score);
            if (typeof parsed.firstTryCount === 'number') setFirstTryCount(parsed.firstTryCount);
            if (typeof parsed.postHintCount === 'number') setPostHintCount(parsed.postHintCount);
            return;
          }
        }
      } catch (e) {
        // Fallback to fresh attempt initialization
      }

      // 2. Fetch student attempts to check if an in-progress or completed attempt exists
      let newAttemptId = `att-${assignment.id}-${currentUser.id}`;
      
      // Only preview if user is teacher, preview ID, or explicitly teacher preview mode
      const isPreview = Boolean(
        currentUser.role !== 'student' &&
        (
          assignment.id === 'preview-assignment' ||
          assignment.id.startsWith('preview') ||
          currentUser.displayName?.includes('(Xem trước)') ||
          currentUser.role === 'teacher'
        )
      );

      if (!isPreview) {
        try {
          const studentAttempts = await dataService.fetchStudentAttempts(currentUser.id).catch(() => []);
          const existingInProgress = studentAttempts.find(
            (a) => a.assignmentId === assignment.id && a.status === 'in_progress'
          );

          if (existingInProgress) {
            setAttemptId(existingInProgress.id);
            if (typeof existingInProgress.currentQuestionIndex === 'number' && existingInProgress.currentQuestionIndex < questions.length) {
              setCurrentIndex(existingInProgress.currentQuestionIndex);
            }
            if (typeof existingInProgress.score === 'number') {
              setScore(existingInProgress.score);
            }
            return;
          }

          const completedCount = studentAttempts.filter(
            (a) => a.assignmentId === assignment.id && a.status === 'completed'
          ).length;

          // If student has already completed before, generate a distinct new attempt ID
          if (completedCount > 0) {
            newAttemptId = `att-${assignment.id}-${currentUser.id}-${Date.now()}`;
          }

          setAttemptId(newAttemptId);

          const attemptDoc: Attempt = {
            id: newAttemptId,
            assignmentId: assignment.id,
            lessonId: assignment.lessonId,
            lessonVersionId: assignment.lessonVersionId,
            lessonTitle: lessonVersion.title,
            studentId: currentUser.id,
            studentName: currentUser.displayName,
            studentCode: currentUser.studentCode || '',
            classId: currentUser.classId || assignment.classId,
            status: 'in_progress',
            currentQuestionIndex: 0,
            score: 0,
            maxScore: calculatedMaxScore,
            firstAttemptCorrectCount: 0,
            postHintCorrectCount: 0,
            totalAttemptsMade: 0,
            startedAt: new Date().toISOString(),
            durationSeconds: 0,
            dataOrigin: 'real',
            environmentTag: 'production',
          };
          await dataService.createAttempt(attemptDoc);
        } catch (err) {
          console.error('Failed to init attempt:', err);
          setAttemptId(newAttemptId);
        }
      } else {
        setAttemptId(newAttemptId);
      }
    }

    if (questions.length > 0) {
      initOrResumeAttempt();
    }
  }, [assignment, currentUser, lessonVersion, questions.length, cacheKey]);

  // Sync ongoing attempt state to sessionStorage for F5 reload safety
  useEffect(() => {
    if (attemptId && !isCompleted) {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            attemptId,
            currentIndex,
            score,
            firstTryCount,
            postHintCount,
            startTime,
          })
        );
      } catch (e) {
        // Ignore quota errors
      }
    }
  }, [attemptId, currentIndex, score, firstTryCount, postHintCount, startTime, isCompleted, cacheKey]);

  // Get current answer string based on interaction type
  const getCurrentAnswer = (): string => {
    if (!currentQuestion) return '';
    switch (currentQuestion.interactionType) {
      case 'single_choice':
        return singleChoiceAnswer;
      case 'number_input':
        return numberInputValue;
      case 'operator_pick':
        return operatorValue;
      case 'expression_match': {
        // Check if all pairs are matched
        const allPairs = currentQuestion.pairs || [];
        if (allPairs.length === 0) return 'MATCHED_ALL';
        const hasConnectedAll = allPairs.every((p) => Boolean(matchedPairs[p.left]));
        if (!hasConnectedAll) return 'INCOMPLETE';
        const isAllCorrect = allPairs.every((p) => matchedPairs[p.left] === p.right);
        return isAllCorrect ? 'MATCHED_ALL' : 'MATCHED_INCORRECT';
      }
      case 'ten_frame_bundle':
        return tenFrameAnswer;
      case 'number_line_order':
        return numberLineAnswer;
      default:
        return singleChoiceAnswer;
    }
  };

  const isAnswerProvided = (): boolean => {
    const ans = getCurrentAnswer();
    return String(ans ?? '').trim() !== '' && ans !== 'INCOMPLETE';
  };

  // Submit current question
  const handleSubmitQuestion = async () => {
    if (!currentQuestion || isSubmitting || !isAnswerProvided()) return;
    setIsSubmitting(true);

    const answerStr = getCurrentAnswer();
    const result = evaluateAnswer(currentQuestion, answerStr);

    const answerDocId = `ans-${attemptId}-q${currentQuestion.order}`;

    if (result.isCorrect) {
      // Correct!
      const points = hasFailedFirstTry ? 7 : 10;
      const nextScore = score + points;
      const nextFirstTry = hasFailedFirstTry ? firstTryCount : firstTryCount + 1;
      const nextPostHint = hasFailedFirstTry ? postHintCount + 1 : postHintCount;

      setScore(nextScore);
      setFirstTryCount(nextFirstTry);
      setPostHintCount(nextPostHint);

      // Record answer via unified data service
      if (!isPreview) {
        try {
          await dataService.saveAttemptAnswer({
            id: answerDocId,
            attemptId,
            questionId: currentQuestion.id,
            studentId: currentUser.id,
            firstGivenAnswer: answerStr,
            finalAnswer: answerStr,
            isFirstAttemptCorrect: !hasFailedFirstTry,
            isFinalCorrect: true,
            attemptsCount: hasFailedFirstTry ? 2 : 1,
            answeredAt: new Date().toISOString(),
            dataOrigin: 'real',
            environmentTag: 'production',
          });
        } catch (err) {
          console.error('Record answer error:', err);
        }
      }

      // Move to next or complete
      if (currentIndex + 1 < questions.length) {
        playCorrectSound();
        setCurrentIndex((prev) => prev + 1);
        resetQuestionInputs();
      } else {
        // Complete mission!
        playCompletedSound();
        const totalDuration = Math.round((Date.now() - startTime) / 1000);
        setDurationSeconds(totalDuration);
        setIsCompleted(true);
        try {
          sessionStorage.removeItem(cacheKey);
        } catch (e) {}

        if (!isPreview) {
          try {
            await dataService.completeAttempt(attemptId, {
              status: 'completed',
              score: nextScore,
              firstAttemptCorrectCount: nextFirstTry,
              postHintCorrectCount: nextPostHint,
              completedAt: new Date().toISOString(),
              durationSeconds: totalDuration,
            });
          } catch (err) {
            console.error('Update attempt completion error:', err);
          }
        }
      }
    } else {
      // Incorrect -> Play subtle sound and show diagnostic hint
      playIncorrectSound();
      setHasFailedFirstTry(true);

      // Save mistake insight to attemptAnswers and mistakeInsights
      if (!isPreview) {
        try {
          await dataService.saveAttemptAnswer({
            id: answerDocId,
            attemptId,
            questionId: currentQuestion.id,
            studentId: currentUser.id,
            firstGivenAnswer: answerStr,
            finalAnswer: answerStr,
            isFirstAttemptCorrect: false,
            isFinalCorrect: false,
            attemptsCount: 1,
            detectedErrorPattern: result.detectedPattern || 'GENERAL_CALCULATION_ERROR',
            hintShown: result.hintText || '',
            hintReinforcementType: result.visualGuidance || '',
            answeredAt: new Date().toISOString(),
            dataOrigin: 'real',
            environmentTag: 'production',
          });

          // Record aggregated insight for teacher via dataService
          if (result.detectedPattern) {
            const insightId = `ins-${currentUser.classId || 'class'}-${result.detectedPattern}-${Date.now()}`;
            await dataService.saveMistakeInsight({
              id: insightId,
              studentId: currentUser.id,
              studentName: currentUser.displayName,
              classId: currentUser.classId || assignment.classId,
              grade: lessonVersion.grade,
              topic: lessonVersion.topic,
              errorPattern: result.detectedPattern,
              errorCount: 1,
              suggestedRemediation: result.visualGuidance || result.hintText || 'Xem lại hướng dẫn của Thám Tử Cáo',
              createdAt: new Date().toISOString(),
              dataOrigin: 'real',
              environmentTag: 'production',
            });
          }
        } catch (err) {
          console.error('Error recording mistake:', err);
        }
      }

      setFeedbackModal({
        isOpen: true,
        pattern: result.detectedPattern,
        hintText: result.hintText,
        visualGuidance: result.visualGuidance,
      });
    }

    setIsSubmitting(false);
  };

  const resetQuestionInputs = () => {
    setSingleChoiceAnswer('');
    setNumberInputValue('');
    setOperatorValue('');
    setMatchedPairs({});
    setTenFrameAnswer('');
    setNumberLineAnswer('');
    setHasFailedFirstTry(false);
  };

  const handleRetryQuestion = () => {
    setFeedbackModal({ isOpen: false });
    // Reset specific input to give fresh attempt
    resetQuestionInputs();
    setHasFailedFirstTry(true); // Flag that this is attempt #2
  };

  const handleRetryMission = async () => {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (e) {}

    // Luyện lại tạo lượt mới độc lập, không xóa lịch sử cũ
    const newAttemptId = `att-${assignment.id}-${currentUser.id}-${Date.now()}`;
    setAttemptId(newAttemptId);
    setCurrentIndex(0);
    setScore(0);
    setFirstTryCount(0);
    setPostHintCount(0);
    setIsCompleted(false);
    resetQuestionInputs();

    try {
      const attemptDoc: Attempt = {
        id: newAttemptId,
        assignmentId: assignment.id,
        lessonId: assignment.lessonId,
        lessonVersionId: assignment.lessonVersionId,
        lessonTitle: lessonVersion.title,
        studentId: currentUser.id,
        studentName: currentUser.displayName,
        studentCode: currentUser.studentCode || '',
        classId: currentUser.classId || assignment.classId,
        status: 'in_progress',
        currentQuestionIndex: 0,
        score: 0,
        maxScore: calculatedMaxScore,
        firstAttemptCorrectCount: 0,
        postHintCorrectCount: 0,
        totalAttemptsMade: 0,
        startedAt: new Date().toISOString(),
        durationSeconds: 0,
        dataOrigin: 'real',
        environmentTag: 'production',
      };
      if (!isPreview) {
        await dataService.createAttempt(attemptDoc);
      }
    } catch (err) {
      console.error('Failed to init retry attempt:', err);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl">
        <p className="text-lg font-bold text-slate-600">Đang tải câu hỏi bài học...</p>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[600px] bg-white rounded-3xl sm:rounded-4xl shadow-xl border-4 border-sky-200 overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between shadow-md">
        <button
          type="button"
          onClick={onExit}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Thoát
        </button>

        <div className="text-center">
          <div className="text-xs font-bold text-sky-200 uppercase tracking-widest">
            {lessonVersion.topic}
          </div>
          <h2 className="text-base sm:text-lg font-black truncate max-w-[240px] sm:max-w-md">
            {lessonVersion.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs sm:text-sm font-black shadow-sm">
            ⭐ {score}/{calculatedMaxScore} điểm
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-100 h-3">
        <div
          className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Counter & Audio Narration */}
      <div className="px-6 pt-5 pb-2 flex items-center justify-between">
        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200">
          Câu {currentIndex + 1} / {questions.length}
        </span>

        <button
          type="button"
          onClick={() => {
            const next = !soundActive;
            setSoundActive(next);
            setSoundEnabled(next);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors border shadow-xs ${
            soundActive
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-300'
          }`}
          title={soundActive ? 'Âm thanh: Đang Bật (Chạm để Tắt)' : 'Âm thanh: Đang Tắt (Chạm để Bật)'}
        >
          {soundActive ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Âm thanh: Bật</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-400" />
              <span>Âm thanh: Tắt</span>
            </>
          )}
        </button>
      </div>

      {/* Question Content Body */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug mb-2">
            {currentQuestion.prompt
              ? currentQuestion.prompt
                  .replace(/^\[ĐÃ SỬA BỞI GIÁO VIÊN\]\s*/i, '')
                  .replace(/^Khung\s*(?:5|10)\s*ô\s*:\s*/i, '')
                  .replace(/^(?:Trong\s*)?khung\s*(?:5|10)\s*ô\s*(?:có\s*)?/i, 'Có ')
                  .trim()
              : ''}
          </h3>

          {/* Render Activity based on interactionType */}
          <div className="my-4">
            {currentQuestion.interactionType === 'single_choice' && (
              <SingleChoiceQuestion
                question={currentQuestion}
                selectedAnswer={singleChoiceAnswer}
                onSelectAnswer={setSingleChoiceAnswer}
                disabled={isSubmitting}
              />
            )}

            {currentQuestion.interactionType === 'number_input' && (
              <NumberInputQuestion
                question={currentQuestion}
                value={numberInputValue}
                onChange={setNumberInputValue}
                disabled={isSubmitting}
              />
            )}

            {currentQuestion.interactionType === 'operator_pick' && (
              <OperatorPickQuestion
                question={currentQuestion}
                selectedOperator={operatorValue}
                onSelectOperator={setOperatorValue}
                disabled={isSubmitting}
              />
            )}

            {currentQuestion.interactionType === 'expression_match' && (
              <ExpressionMatchQuestion
                question={currentQuestion}
                matchedPairs={matchedPairs}
                onPairsChange={setMatchedPairs}
                disabled={isSubmitting}
              />
            )}

            {currentQuestion.interactionType === 'ten_frame_bundle' && (
              <TenFrameBundleQuestion
                question={currentQuestion}
                selectedAnswer={tenFrameAnswer}
                onSelectAnswer={setTenFrameAnswer}
                disabled={isSubmitting}
              />
            )}

            {currentQuestion.interactionType === 'number_line_order' && (
              <NumberLineOrderQuestion
                question={currentQuestion}
                answer={numberLineAnswer}
                onAnswerChange={setNumberLineAnswer}
                disabled={isSubmitting}
              />
            )}
          </div>
        </div>

        {/* Bottom Submission Action */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            disabled={!isAnswerProvided() || isSubmitting}
            onClick={handleSubmitQuestion}
            className={`min-h-[52px] px-8 py-3.5 rounded-2xl text-lg font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isAnswerProvided() && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white shadow-emerald-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <span>Đang kiểm tra...</span>
            ) : (
              <>
                <span>Trả lời</span> <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diagnostic Feedback Modal */}
      <DetectiveFeedbackModal
        isOpen={feedbackModal.isOpen}
        pattern={feedbackModal.pattern}
        hintText={feedbackModal.hintText}
        visualGuidance={feedbackModal.visualGuidance}
        onRetry={handleRetryQuestion}
        canTryAgain={true}
      />

      {/* Completion Modal */}
      <CelebrationBadgeModal
        isOpen={isCompleted}
        score={score}
        maxScore={calculatedMaxScore}
        firstTryCount={firstTryCount}
        postHintCount={postHintCount}
        durationSeconds={durationSeconds}
        onFinish={onExit}
        onRetry={handleRetryMission}
      />
    </div>
  );
};
