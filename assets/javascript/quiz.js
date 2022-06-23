//quiz state object
//stores the prompts that have been answered, whether they were wrong or right, and whether a quiz is in progress or not.
const quiz = {
  prompts:[],
  answered:[],
  clickFunction:()=>console.log('site not initialized'),
  inProgress:false,
  timerID:0,
  startTime:0,
  remainingTime:0,
  time:60,
  timeModifiers:0,
  timerElements:{
    clock: document.getElementById('clock'),
    span: document.getElementById('clock-span')
  }
};

const leaderBoard = JSON.parse(localStorage.getItem('leaderBoard')) || [];
console.log(leaderBoard)
//The start/continue button
const contButton = document.getElementById('continue');
const body = Array.from(document.getElementsByTagName('body'))[0];

/**
 * Progresses the timer display
 * @param {number} [modifier = 0] - Amount of seconds to change the timer by
 */
const progressTime = (modifier = 0)=>{
  quiz.remainingTime = Math.max(0,Math.ceil(quiz.time - ((Date.now() - quiz.startTime) / 1000)) + quiz.timeModifiers);
  quiz.timerElements.clock.style.setProperty('--used',quiz.time - quiz.remainingTime);
  quiz.timerElements.span.replaceChildren(quiz.remainingTime);
  if(!modifier && quiz.remainingTime > 0){
    //Set up the timer to be updated again in 1 second
    quiz.timerID = setTimeout(progressTime,1000);
  }else if(quiz.remainingTime <= 0){
    finishQuiz();
  }
}

/**
 * Creates and starts the timer display
 * @param {number} [duration = 60] - Duration of the quiz.
 */
const startTimer = (duration = 60)=>{
  quiz.time = duration;
  quiz.startTime = Date.now();
  const clockContainer = Array.from(document.getElementsByClassName('clock-container'))[0];
  clockContainer.style = '';
  quiz.timerElements.clock.style.setProperty('--max',duration);
  quiz.timerElements.clock.style.setProperty('--used',0);
  progressTime(); 
}

/**
 * Stops the timer from progressing
 */
const stopTimer = () => {
  clearTimeout(quiz.timerID);
  quiz.timerID = 0;
}

/**
 * Randomizes the order of the queries
 */
const randomizeQueries = () => {
  quiz.prompts = quiz.prompts.sort((a,b) => 0.5 - Math.random() );
};
//Listener Functions
/**
 * Starts the quiz
 */
const startQuiz = ()=>{
  quiz.inProgress = true;
  quiz.answered = [];
  randomizeQueries();
  //Change the clickFunction to the nextQuestion function
  quiz.clickFunction = answerQuestion;
  contButton.replaceChildren('Submit');
  startTimer();
  nextQuestion();
}

/**
 * Collects the answer to a question, checks it, and updates the answer response
 */
const answerQuestion = ()=>{
  const answer = Array.from(document.querySelectorAll('input[name="answer_option"]')).find(radio => radio.checked)?.value;
  const currentPrompt = quiz.prompts[quiz.answered.length];
  const answerIndex = currentPrompt.options.indexOf(answer);
  let correct = answerIndex === currentPrompt.correctIndex;
  quiz.answered.push(correct);
  let result = 'correct!';
  if(!correct){
    result = 'incorrect!';
    quiz.timeModifiers -= 5;
  }
  updateResultSpan(result,result.replace(/!/,''));
  nextQuestion();
};

/**
 * Checks the response to the prompt, and then continues to the next question.
 */
const nextQuestion = ()=>{
  const prompt = quiz.prompts[quiz.answered.length];
  if(!prompt){
    //If we've finished the quiz, move to the finishing state.
    finishQuiz();
    return;
  }
  const span = clearQuestion();
  insertQuestion(span,prompt);
};

/**
 * Clears the previous question text
 */
const clearQuestion = () => {
  const quizInterface = document.getElementById('quiz-interface');
  const children = Array.from(quizInterface.children);
  const span = children.shift();
  return span;
};

/**
 * resets the quiz interface to the initial state
 */
const resetQuiz = () => {
  console.log('resetting quiz');
  const noticeSpan = document.querySelector('#quiz-interface > span')
  noticeSpan.replaceChildren('Click below to start the quiz. You will have 1 minute to complete the quiz. Wrong answers will deduct 5 seconds from the timer.');
  contButton.replaceChildren('Take the Quiz!');
  const optionDiv = document.getElementById('options');
  optionDiv.replaceChildren();
  //Initialize the clickFunction to the startQuiz function
  quiz.clickFunction = startQuiz;
  contButton.removeAttribute('disabled');
};

/**
 * Parses out basic markdown code syntax into html entities
 * @param {string} text - The text to check for markdown syntax
 */
const parseCodeShorthand = (text) => {
  console.log('text',text);
  return text.replace(/`([^`]+?)`/g,'<pre><code>$1</code></pre>')
}

/**
 * Inserts the prompt and options into the interface.
 * @param {HTMLElement} interface - The section container for the quiz prompts
 * @param {HTMLElement} span - The span that will hold the prompt text
 * @param {object} prompt - Describes the prompt to be inserted
 */
const insertQuestion = (span,prompt) => {
  span.innerHTML = parseCodeShorthand(prompt.prompt);
  const optionDiv = document.getElementById('options');
  optionDiv.replaceChildren();
  prompt.options.forEach( (opt,index) => {
    const answerCheck = document.createElement('input');
    answerCheck.name = 'answer_option';
    answerCheck.value = opt;
    answerCheck.type = 'radio';
    answerCheck.id = `answer-${index}`;
    const answerLabel = document.createElement('label');
    answerLabel.setAttribute('for',answerCheck.id);
    answerLabel.append(opt);
    optionDiv.append(answerCheck,answerLabel);
  });
};

/**
 * Finishes the quiz and creates the leaderboard name entry dialog
 */
const finishQuiz = () => {
  stopTimer();

  quiz.percentage = quiz.answered.filter(a => a).length / quiz.prompts.length * 100;


  //Get the span to display the instructions and update the displayed text.
  const noticeSpan = document.querySelector('#quiz-interface > span');
  noticeSpan.innerHTML = `You finished the quiz in <strong>${quiz.time - quiz.remainingTime}</strong> seconds with a score of <strong>${quiz.percentage}%</strong>. Enter your initials below to save your results.`
  
  const options = document.getElementById('options');
  const initialsInput = document.createElement('input');
  initialsInput.type = 'text';
  initialsInput.name = 'initials';
  options.replaceChildren(initialsInput);

  contButton.replaceChildren('Save Results');
  quiz.clickFunction = saveResults;
};
//Listen for clicks on the continue button and call the function currently assigned to quiz.clickFunction
contButton.addEventListener('click',()=>{
  quiz.clickFunction();
});

/**
 * 
 * @param {string} text - Text to insert into the result span.
 * @param {string} className - The class to add to the result span
 */
const updateResultSpan = (text,status)=>{
  const resultSpan = document.getElementById('result');
  resultSpan.replaceChildren(text);
  resultSpan.className = `show ${status}`;
  setTimeout(()=>{
    resultSpan.className = '';
  },3000,resultSpan)
};

const saveResults = ()=>{
  const initials = document.querySelector('input[name="initials"]').value;
  if(!initials || initials.length < 2){
    updateResultSpan('Initials must be at least two characters','incorrect');
  };
  leaderBoard.push({initials,time:quiz.time - quiz.remainingTime,score:quiz.percentage});
  localStorage.setItem('leaderBoard',JSON.stringify(leaderBoard));
  updateLeaderBoard();
  window.location.href = `${window.location.href.replace(/#.*/,'')}#leaderboard`;
  resetQuiz();
};

/**
 * Updates the leaderboard to show the current standings.
 */
const updateLeaderBoard = ()=>{
  const aside = document.getElementById('leaderboard');
  leaderBoard.sort((a,b) => b.score - a.score );
  const ol = document.querySelector('#leaderboard > ol');
  ol.replaceChildren();
  leaderBoard.forEach(obj => {
    const li = document.createElement('li');
    const flexSpan = document.createElement('span');
    li.append(flexSpan);
    //Create the spans for each data element of a leaderboard entry
    const suffixLookup = {
      initials:'',
      time:'s',
      score:'%'
    };
    Object.entries(suffixLookup).forEach( ([prop,suffix]) => {
      const span = document.createElement('span');
      const val = `${obj[prop]}${suffix}`;
      span.append(val);
      flexSpan.append(span);
    });
    ol.append(li);
  });
}

//Get default

// Create Listeners

//Setup the quiz
/**
 * Function to grab the quiz data from the csv file. Uses the Papa Parse library to parse a csv file to get the prompt information.
 */
(async function(){
  const github = window.location.href.match(/github/);
  const prefix = github ? //Allows the js to pull from local version during development and the server version when live.
    'https://raw.githubusercontent.com/Kurohyou/timed-coding-quiz-sc/main' :
    '';
  const data = await new Promise(resolve => {
    Papa.parse(`${prefix}/data/questions.csv`,{
      header:true,
      download:true,
      complete:results => resolve(results)
    });
  });
  quiz.prompts = data.data
    .filter((d) => d.prompt )
    .map((d)=>{
      return Object.entries(d)
        .reduce((memo,[key,val]) => {
          if(val && key.startsWith('option')){
            memo.options.push(val);
          }else if(val){
            memo[key] = key === 'correctIndex' ?
              +val :
              val;
          }
          return memo;
        },{options:[]});
    });
  resetQuiz();
  updateLeaderBoard();
})();