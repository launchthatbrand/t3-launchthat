/**
 * Get quiz statistics
 */
export const getQuizStats = async (ctx, quizId) => {
    const quiz = await ctx.db.get(quizId);
    if (!quiz) {
        return null;
    }
    const questionCount = quiz.questions?.length ?? 0;
    const isPublished = quiz.isPublished ?? false;
    const hasCorrectAnswers = quiz.questions?.every((q) => q.correctAnswer !== undefined) ?? false;
    let attachedTo = "unattached";
    if (quiz.courseId) {
        attachedTo = "course";
    }
    else if (quiz.lessonId) {
        attachedTo = "lesson";
    }
    else if (quiz.topicId) {
        attachedTo = "topic";
    }
    return {
        questionCount,
        isPublished,
        hasCorrectAnswers,
        attachedTo,
    };
};
/**
 * Check if quiz is ready for publication
 */
export const isQuizReadyForPublication = async (ctx, quizId) => {
    const quiz = await ctx.db.get(quizId);
    if (!quiz) {
        return false;
    }
    // Quiz must have a title and at least one question
    if (!quiz.title || !quiz.questions || quiz.questions.length === 0) {
        return false;
    }
    // All questions must have correct answers
    const allQuestionsValid = quiz.questions.every((question) => {
        return (question.questionText &&
            question.correctAnswer !== undefined &&
            question.type);
    });
    return allQuestionsValid;
};
/**
 * Calculate quiz completion score
 */
export const calculateQuizScore = (userAnswers, correctAnswers) => {
    if (userAnswers.length !== correctAnswers.length) {
        throw new Error("User answers and correct answers length mismatch");
    }
    const totalQuestions = correctAnswers.length;
    let correctCount = 0;
    for (let i = 0; i < totalQuestions; i++) {
        const userAnswer = userAnswers[i];
        const correctAnswer = correctAnswers[i];
        // Handle different answer types
        if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
            // Multiple choice - compare arrays
            const isCorrect = correctAnswer.length === userAnswer.length &&
                correctAnswer.every((answer) => userAnswer.includes(answer));
            if (isCorrect)
                correctCount++;
        }
        else if (userAnswer === correctAnswer) {
            // Single choice or true/false
            correctCount++;
        }
    }
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    return {
        score: correctCount,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        totalQuestions,
        correctCount,
    };
};
