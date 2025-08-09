
console.log('=== Lesson System Test ===');

// Test lesson loading
const testLessonSystem = async () => {
  try {
    console.log('1. Testing lesson API...');
    const response = await fetch('http://localhost:3000/api/student-lessons/Jake%20Ferguson');
    const lessons = await response.json();
    console.log('✅ Lessons loaded:', lessons.length, 'lessons');
    
    console.log('2. Testing lesson renderer...');
    if (window.lessonRenderer) {
      console.log('✅ Lesson renderer available');
      const initialized = window.lessonRenderer.initialize('Jake Ferguson', 'test-container');
      console.log('✅ Initialization result:', initialized);
    } else {
      console.log('❌ Lesson renderer not available');
    }
    
    console.log('3. Testing lesson engine...');
    if (window.lessonEngine) {
      console.log('✅ Lesson engine available');
    } else {
      console.log('❌ Lesson engine not available');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testLessonSystem);
} else {
  testLessonSystem();
}

