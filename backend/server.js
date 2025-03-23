const { execSync } = require("child_process");
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

// Function to kill process on port (Windows)
const killProcessOnPort = (port) => {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = result.split("\n").filter(line => line.includes("LISTENING"));
    
    if (lines.length > 0) {
      const pid = lines[0].trim().split(/\s+/).pop(); // Extracting PID
      execSync(`taskkill /PID ${pid} /F`);
      console.log(`✅ Killed process with PID ${pid} on port ${port}`);
    }
  } catch (err) {
    console.log(`⚠️ No process found on port ${port} or insufficient privileges`);
  }
};

// Kill process before starting the server
killProcessOnPort(PORT);

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "questionbank",
  password: "Devesh",
  port: 5432,
});

// API to fetch boards
app.get("/api/boards", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, board_name FROM boards");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// API to fetch classes
app.get("/api/classes", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, class_name FROM classes");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// API to fetch subjects
app.get("/api/subjects", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, subject_name FROM subjects");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 1️⃣ Get Board ID by Board Name
app.get("/api/get-board-id", async (req, res) => {
  const { board_name } = req.query;
  try {
    const result = await pool.query("SELECT id FROM boards WHERE board_name = $1", [board_name]);
    res.json(result.rows[0] || { id: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// 2️⃣ Get Class ID by Class Name
app.get("/api/get-class-id", async (req, res) => {
  const { class_name } = req.query;
  try {
    const result = await pool.query("SELECT id FROM classes WHERE class_name = $1", [class_name]);
    res.json(result.rows[0] || { id: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// 3️⃣ Get Subject ID by Subject Name
app.get("/api/get-subject-id", async (req, res) => {
  const { subject_name } = req.query;
  try {
    const result = await pool.query("SELECT id FROM subjects WHERE subject_name = $1", [subject_name]);
    res.json(result.rows[0] || { id: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// API to get question_type ID
app.get("/api/get-question_type-id", async (req, res) => {
  const { type_name } = req.query;  // Get type_name from query parameters

  console.log("Received type_name:", type_name);  // Debugging log

  try {
    const result = await pool.query(
      "SELECT id FROM question_types WHERE type_name = $1",
      [type_name]
    );

    if (result.rows.length > 0) {
      res.json({ id: result.rows[0].id });  // Return the ID
    } else {
      res.json({ id: null });  // Return null if no match found
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});


// ✅ Fetch Chapters Based on Board, Class, and Subject
app.get("/api/get-chapters", async (req, res) => {
  const { board_id, class_id, subject_id } = req.query;
  try {
    const result = await pool.query(
      "SELECT id, chapter_name FROM chapters WHERE board_id = $1 AND class_id = $2 AND subject_id = $3",
      [board_id, class_id, subject_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching chapters" });
  }
});

// API to fetch question_types
app.get("/api/question_types", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, type_name FROM question_types");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.get("/api/get-questions", async (req, res) => {
  try {
    const { board_id, class_id, subject_id, chapter_id, question_type } = req.query;

    // ✅ Ensure all required query parameters are received
    if (!board_id || !class_id || !subject_id || !chapter_id || !question_type) {
      return res.status(400).json({ error: "Missing required query parameters." });
    }

    // ✅ Fetch questions from the database
    const questionQuery = `
      SELECT q.id, q.question_text
      FROM questions q
      WHERE q.board_id = $1 AND q.class_id = $2 AND q.subject_id = $3
      AND q.chapter_id = $4 AND q.question_type_id = $5
    `;

    const { rows: questions } = await pool.query(questionQuery, [
      board_id,
      class_id,
      subject_id,
      chapter_id,
      question_type,
    ]);

    console.log("YAHA PAR DYAN DE:", question_type);

    // ✅ Function to format answers with line breaks and indentation
const formatAnswerWithPoints = (answerText) => {
  if (!answerText) return "No answer provided";

  return answerText
    .replace(/\(i\)/g, "\n(i)")
    .replace(/\(ii\)/g, "\n(ii)")
    .replace(/\(iii\)/g, "\n(iii)")
    .replace(/\(iv\)/g, "\n(iv)")
    .replace(/\(v\)/g, "\n(v)")
    .replace(/\(vi\)/g, "\n(vi)")
    .replace(/\(vii\)/g, "\n(vii)")
    .replace(/\(viii\)/g, "\n(viii)")
    .replace(/\(a\)/g, "\n\t(a)")
    .replace(/\(b\)/g, "\n\t(b)")
    .replace(/\(c\)/g, "\n\t(c)")
    .replace(/\(d\)/g, "\n\t(d)");
};

    if (questions.length === 0) {
      return res.json([]); // ✅ Return empty array if no questions found
    }

    // ✅ Fetch options and answers for each question
    const formattedQuestions = await Promise.all(
      questions.map(async (question) => {
        let options = [];
        let answer = "No answer provided";

        switch (question_type.toString()) {
            case "1": // MCQ
            const optionsQuery = `SELECT option_text, is_correct FROM mcq_options WHERE question_id = $1`;
            const { rows: mcqOptions } = await pool.query(optionsQuery, [question.id]);
            options = mcqOptions;

            console.log(`Options for question ${question.id}:`, options); // ✅ Debugging output

            // ✅ Extract correct answer
            const correctOption = options.find((option) => option.is_correct);
            answer = correctOption
              ? `(${String.fromCharCode(97 + options.indexOf(correctOption))}) ${correctOption.option_text}`
              : "No answer provided";
            break;

            case "2": // Match the Following
            // ✅ Correct Backend Code
            const wrongPairQuery = `
            SELECT DISTINCT ON (m1.column_a) 
            m1.column_a AS "Column A",
            m2.column_b AS "Column B"
            FROM match_the_following m1
            JOIN match_the_following m2
            ON m1.question_id = m2.question_id AND m1.sort_order <> m2.sort_order
            WHERE m1.question_id = $1
            ORDER BY m1.column_a, m2.column_b
            `;

const { rows: wrongPairs } = await pool.query(wrongPairQuery, [question.id]);
// ✅ Map to ensure unique pairs
const uniqueWrongPairs = [];
const seenColumns = new Set();

wrongPairs.forEach((pair, index) => {
  if (!seenColumns.has(pair["Column A"])) {
    uniqueWrongPairs.push({
      columnA: `(${index + 1}) ${pair["Column A"]}`,
      columnB: `(${String.fromCharCode(97 + uniqueWrongPairs.length)}) ${pair["Column B"]}`
    });
    seenColumns.add(pair["Column A"]);
  }
});

const rightPairQuery = `
SELECT 
  column_a AS "Column A",
  column_b AS "Column B"
FROM match_the_following
WHERE question_id = $1
ORDER BY sort_order;
`;

const { rows: correctOrder } = await pool.query(rightPairQuery, [question.id]);

// ✅ Format Correct Pair Order
const formattedCorrectPairs = correctOrder.map((pair, index) => ({
  columnA: `(${index + 1}) ${pair["Column A"]}`,
  columnB: `(${String.fromCharCode(97 + index)}) ${pair["Column B"]}`
}));

// ✅ Make sure 'wrongPairs' and 'correctOrder' are correctly assigned
// ✅ Return Final Options
options = [
  {
    order: "Wrong Order",
    data: uniqueWrongPairs // Corrected wrong pairs with unique values
  },
  {
    order: "Right Order",
    data: formattedCorrectPairs
  }
];

            break;

            

            case "3": // One Sentence Answer
            const oneSentenceQuery = `SELECT answer_text FROM answeronesentence WHERE question_id = $1`;
            const {rows: oneSentence } = await pool.query(oneSentenceQuery, [question.id]);
            answer = oneSentence.length > 0 ? oneSentence[0].answer_text : "No answer provided";
            break;

            case "6": // Geographical Answers
            const geographicalQuery = `SELECT answer_text FROM reason_answers WHERE question_id = $1`;
            const { rows: geographical } = await pool.query(geographicalQuery, [question.id]);
            answer = geographical.length > 0 ? formatAnswerWithPoints(geographical[0].answer_text) : "No answer provided";
            break;

            case "7": // Short Notes
            const shortNotesQuery = `SELECT answers_text FROM notes_answer WHERE question_id = $1`;
            const { rows: shortNotes } = await pool.query(shortNotesQuery, [question.id]);
            answer = shortNotes.length > 0 ? formatAnswerWithPoints(shortNotes[0].answers_text) : "No answer provided";
            break;
        

            case "8": // Answer in Brief
            const answerinbriefQuery = `SELECT answer_text FROM answerinbrief WHERE question_id = $1`;
            const { rows: brief } = await pool.query(answerinbriefQuery, [question.id]);
          
            // ✅ Apply the format function to concept_answers
            answer =
              brief.length > 0
                ? formatAnswerWithPoints(brief[0].answer_text)
                : "No answer provided";
            break;

            case "11": // Fetch differentiation points
            const fetchQuery = `SELECT column_a, column_b, points FROM public.distinguishbetween WHERE question_id = $1`;
            const { rows: result } = await pool.query(fetchQuery, [question.id]);
        
            if (result.length > 0) {
                const { column_a, column_b, points } = result[0];
        
                console.log("Points Data Type:", typeof points);
                console.log("Points Value:", points);
        
                // Ensure points is parsed from JSONB
                const parsedPoints = Array.isArray(points) ? points : JSON.parse(points);
        
                // Formatting the differentiation output
                const formattedText = `**${column_a} vs. ${column_b}**\n\n` + 
                    parsedPoints.map((point, index) => 
                        `${index + 1}. **${column_a}:** ${point.point_a}\n   **${column_b}:** ${point.point_b}\n`
                    ).join("\n");
        
                // Send answer as an object
                answer = {
                    text: formattedText,
                    points: parsedPoints,
                    column_a: column_a,
                    column_b: column_b
                };
            } else {
                answer = { text: "No differentiation data available.", points: [] };
            }
            break;

          
            case "16": // Identify the Wrong Pair
            const fetchPairQuery = `
            SELECT 
            term_1 AS col1,
            term_2 AS col2,
            is_correct AS is_valid,
            corrected_term_2 AS corrected_text
            FROM 
            question_pairs
            WHERE 
            question_id = $1
              `;

            const { rows: fetchedPairs } = await pool.query(fetchPairQuery, [question.id]);

            if (fetchedPairs.length === 0) {
            answer = "No pairs available for this question.";
            } else {
            // Create options table for pairs
            let optionsList = fetchedPairs
            .map(
                (pair, index) =>
                    `${index + 1}. ${pair.col1} - ${pair.col2}`
            )
            .join("\n");

        // Filter out incorrect pairs
        let invalidPairs = fetchedPairs.filter((pair) => !pair.is_valid);

        if (invalidPairs.length > 0) {
            let wrongPairInfo = invalidPairs
                .map(
                    (pair) =>
                        `❌ Wrong Pair: ${pair.col1} - ${pair.col2}\n✅ Correction: ${pair.corrected_text}`
                )
                .join("\n");

            answer = `${optionsList}\n\n${wrongPairInfo}`;
        } else {
            answer = `${optionsList}\n\n✅ All pairs are correct.`;
        }
    }
            break;


        
          
            case "17": // Explain the Concept
            const explaintheConceptQuery = `SELECT concept_answers FROM explaintheterms WHERE question_id = $1`;
            const { rows: concept } = await pool.query(explaintheConceptQuery, [question.id]);
          
            // ✅ Apply the format function to concept_answers
            answer =
              concept.length > 0
                ? formatAnswerWithPoints(concept[0].concept_answers)
                : "No answer provided";
            break;

            case "18": // Give one word for each of the following
            const oneWordQuery = `SELECT answer_text FROM one_word_answers WHERE question_id = $1`;
            const { rows: oneWord } = await pool.query(oneWordQuery, [question.id]);
        
            answer =
              oneWord.length > 0
                ? oneWord[0].answer_text
                : "No answer provided";
            break;
        


          default:
            console.log(`Unknown question type: ${question_type}`);
            answer = "Unknown question type";
            break;
        }

        // ✅ Return the final object for each question
        return {
          question_type,
          id: question.id,
          question_text: question.question_text,
          options: options, // Include options in response
          answer: answer, // Correctly return the assigned answer
        };
      })
    );

    console.log("Formatted Questions:", formattedQuestions);

    res.json(formattedQuestions); // ✅ Send formatted response
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});




// Start the server with dynamic port handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${server.address().port}`);
});
