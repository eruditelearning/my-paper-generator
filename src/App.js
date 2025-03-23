import React, { useState, useEffect } from "react";

const PaperGenerator = () => {
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedQuestionType, setSelectedQuestionType] = useState("");
  const [boardId, setBoardId] = useState(null);
  const [classId, setClassId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionTypeId, setQuestionTypeId] = useState(null); // ✅ Define state

  const questionsPerPage = 15;

  useEffect(() => {
    fetch("http://localhost:5000/api/boards")
      .then((res) => res.json())
      .then((data) => setBoards(data))
      .catch((err) => console.error("Error fetching boards:", err));

    fetch("http://localhost:5000/api/subjects")
      .then((res) => res.json())
      .then((data) => setSubjects(data))
      .catch((err) => console.error("Error fetching subjects:", err));

    fetch("http://localhost:5000/api/classes")
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch((err) => console.error("Error fetching classes:", err));

    fetch("http://localhost:5000/api/question_types")
      .then((res) => res.json())
      .then((data) => setQuestionTypes(data))
      .catch((err) => console.error("Error fetching question types:", err));
  }, []);

  useEffect(() => {
    const fetchIdsAndChapters = async () => {
      if (!selectedBoard || !selectedClass || !selectedSubject) return;

      try {
        // Fetch Board ID
        const boardResponse = await fetch(
          `http://localhost:5000/api/get-board-id?board_name=${selectedBoard}`
        );
        const boardData = await boardResponse.json();
        setBoardId(boardData.id);
        console.log("✅ Board ID:", boardData.id);

        // Fetch Class ID
        const classResponse = await fetch(
          `http://localhost:5000/api/get-class-id?class_name=${selectedClass}`
        );
        const classData = await classResponse.json();
        setClassId(classData.id);
        console.log("✅ Class ID:", classData.id);

        // Fetch Subject ID
        const subjectResponse = await fetch(
          `http://localhost:5000/api/get-subject-id?subject_name=${selectedSubject}`
        );
        const subjectData = await subjectResponse.json();
        setSubjectId(subjectData.id);
        console.log("✅ Subject ID:", subjectData.id);

        // Fetch Chapters after IDs are set
        if (boardData.id && classData.id && subjectData.id) {
          const chaptersResponse = await fetch(
            `http://localhost:5000/api/get-chapters?board_id=${boardData.id}&class_id=${classData.id}&subject_id=${subjectData.id}`
          );
          const chaptersData = await chaptersResponse.json();
          setChapters(chaptersData);
          console.log("✅ Chapters:", chaptersData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchIdsAndChapters();
  }, [selectedBoard, selectedClass, selectedSubject]); // Runs whenever Board, Class, or Subject changes

  const handleGenerateQuestions = async () => {
    if (
      !selectedBoard ||
      !selectedClass ||
      !selectedSubject ||
      !selectedChapter ||
      !selectedQuestionType
    ) {
      alert("Please select all fields before generating questions.");
      return;
    }

    try {
      // Fetch Subject ID
      const subjectResponse = await fetch(
        `http://localhost:5000/api/get-subject-id?subject_name=${selectedSubject}`
      );
      const subjectData = await subjectResponse.json();
      setSubjectId(subjectData.id);
      console.log("✅ Subject ID:", subjectData.id);

      // Fetch question_type ID
      const questionTypeResponse = await fetch(
        `http://localhost:5000/api/get-question_type-id?type_name=${selectedQuestionType}`
      );
      const questionTypeData = await questionTypeResponse.json(); // ✅ Correct variable
      setQuestionTypeId(questionTypeData.id);
      console.log("✅ Question Type ID:", questionTypeData.id);
      

      // Fetch Questions From the Questions Table
      const response = await fetch(
        `http://localhost:5000/api/get-questions?board_id=${boardId}&class_id=${classId}&subject_id=${subjectId}&chapter_id=${selectedChapter}&question_type=${questionTypeData.id}`
      );
      console.log("✅ API Response:", response);
      const data = await response.json();
      console.log("✅ Data :", data);

      setQuestions(data);
      setCurrentPage(1); // Reset pagination to the first page
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  if (!Array.isArray(questions)) {
    console.error("Error: questions is not an array", questions);
    return null; // Prevents rendering errors
  }
  const currentQuestions = questions.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const QuestionWithAnswer = ({ q }) => (
    <>
      <p className="mt-1 leading-tight">
        <span className="font-semibold">Ans:</span>
      </p>
      {q.answer
        ? q.answer.split("\n").map((line, index) => (
            <p key={index} className="mt-1">
              {line.trim()}
            </p>
          ))
        : "Not Available"}
    </>
  );
  
  const DistinguishTable = ({ q }) => {
    console.log("Received answer:", q.answer);
    console.log("Received points:", q.answer?.points);
  
    return (
      <>
        {Array.isArray(q.answer?.points) && q.answer.points.length > 0 ? (
          <table className="mt-2 border-separate border-spacing-0 border border-black w-full">
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-black px-4 py-2 text-left">{q.answer.column_a}</th>
                <th className="border border-black px-4 py-2 text-left">{q.answer.column_b}</th>
              </tr>
            </thead>
            <tbody>
              {q.answer.points.map((point, index) => (
                <tr key={index} className="bg-white even:bg-gray-100">
                  <td className="border border-black px-4 py-2">{point.point_a}</td>
                  <td className="border border-black px-4 py-2">{point.point_b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No data available</p>
        )}
      </>
    );
  };
  
  const RenderWrongPair = ({ q }) => {
    let pairs = [];
    let wrongPair = null;
    let correction = null;
  
    // If structured options are available, use them; otherwise, parse the answer string.
    if (q.options && q.options.length > 0) {
      pairs = q.options;
    } else if (q.answer) {
      // Split the answer string by newline and remove any empty lines.
      const lines = q.answer.split('\n').map(line => line.trim()).filter(line => line);
  
      // Find the index where the wrong pair details start.
      const wrongPairIndex = lines.findIndex(line => line.startsWith("❌ Wrong Pair:"));
  
      // Parse the options from the beginning of the answer up to the wrong pair details.
      const optionLines = wrongPairIndex > 0 ? lines.slice(0, wrongPairIndex) : lines;
      pairs = optionLines.map(optionLine => {
        // Expecting the format: "1. First Column - Second Column"
        const regex = /^[0-9]+\.\s*(.+?)\s*-\s*(.+)$/;
        const match = optionLine.match(regex);
        if (match) {
          return {
            first_column: match[1],
            second_column: match[2]
          };
        }
        return null;
      }).filter(pair => pair !== null);
  
      // Parse the wrong pair and its correction if available.
      if (wrongPairIndex !== -1) {
        const wrongLine = lines[wrongPairIndex];
        const corrLine = lines[wrongPairIndex + 1] || "";
  
        const wrongRegex = /^❌ Wrong Pair:\s*(.+?)\s*-\s*(.+)$/;
        const wrongMatch = wrongLine.match(wrongRegex);
        if (wrongMatch) {
          wrongPair = {
            first_column: wrongMatch[1],
            second_column: wrongMatch[2]
          };
        }
  
        const corrRegex = /^✅ Correction:\s*(.+)$/;
        const corrMatch = corrLine.match(corrRegex);
        if (corrMatch) {
          correction = corrMatch[1];
        }
      }
    }
  
    return (
      <>
        {/* Options Table */}
        <h3 className="font-semibold text-lg mt-4"></h3>
        {pairs.length > 0 ? (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full border border-collapse border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Column A</th>
                  <th className="border border-gray-300 p-2 text-left">Column B</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((pair, index) => (
                  <tr key={`pair-${index}`}>
                    <td className="border border-gray-300 p-2">{pair.first_column}</td>
                    <td className="border border-gray-300 p-2">{pair.second_column}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No pairs available.</p>
        )}
  
        {/* Answer Section */}
        <h3 className="font-semibold text-lg mt-6 text-red-600">Answer:</h3>
        {wrongPair ? (
          <div className="mt-2">
            <p className="text-red-600">
              ❌ Wrong Pair: {wrongPair.first_column} - {wrongPair.second_column}
            </p>
            <p className="text-green-600">
              ✅ Correction: {correction}
            </p>
          </div>
        ) : (
          <p className="text-green-600">✅ All pairs are correct.</p>
        )}
      </>
    );
  };
  
  
  
  
  
  
  
  
  const RenderMCQ = ({ q }) => (
    <>
      {Array.isArray(q.options) && q.options.length > 0 ? (
        <ul className="ml-4 list-none space-y-1">
          {q.options.map((option, i) => (
            <li key={i} className="p-1">
              {String.fromCharCode(65 + i)}. {option.option_text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No options available</p>
      )}
      <p className="font-semibold text-green-600 mt-2">
        Ans:{" "}
        {q.options
          .map((opt, i) =>
            opt.is_correct
              ? `(${String.fromCharCode(65 + i)}) ${opt.option_text}`
              : ""
          )
          .join("") || "Not Available"}
      </p>
    </>
  );

    const RenderMatchTables = ({ q }) => {
    const wrongOrder = q.options.find((opt) => opt.order === "Wrong Order")?.data || [];
    const rightOrder = q.options.find((opt) => opt.order === "Right Order")?.data || [];
    
    
    
    return (
      <>
        {/* 🛑 Wrong Pairing Table */}
        <h3 className="font-semibold text-lg mt-4 text-red-600"></h3>
        {wrongOrder.length > 0 ? (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full border border-collapse border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Column 'A'</th>
                  <th className="border border-gray-300 p-2 text-left">Column 'B'</th>
                </tr>
              </thead>
              <tbody>
                {wrongOrder.map((pair, i) => (
                  <tr key={`wrong-${i}`}>
                    <td className="border border-gray-300 p-2">{pair.columnA}</td>
                    <td className="border border-gray-300 p-2">{pair.columnB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No wrong pairs available.</p>
        )}
  
        {/* ✅ Correct Pairing Table */}
        <h3 className="font-semibold text-lg mt-6 text-green-600">Ans:</h3>
        {rightOrder.length > 0 ? (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full border border-collapse border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Column 'A'</th>
                  <th className="border border-gray-300 p-2 text-left">Column 'B'</th>
                </tr>
              </thead>
              <tbody>
                {rightOrder.map((pair, i) => (
                  <tr key={`right-${i}`}>
                    <td className="border border-gray-300 p-2">{pair.columnA}</td>
                    <td className="border border-gray-300 p-2">{pair.columnB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No correct pairs available.</p>
        )}
      </>
    );
  };
  
  
  

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Automatic Paper Generator</h1>

      {/* Board Selection */}
      <label className="block font-semibold mt-4">Board</label>
      <select
        className="border p-2 w-full"
        onChange={(e) => setSelectedBoard(e.target.value)}
      >
        <option value="">Select Board</option>
        {boards.map((board) => (
          <option key={board.id} value={board.board_name}>
            {board.board_name}
          </option>
        ))}
      </select>

      {/* Class Selection */}
      <label className="block font-semibold mt-4">Class</label>
      <select
        className="border p-2 w-full"
        onChange={(e) => setSelectedClass(e.target.value)}
      >
        <option value="">Select Class</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.class_name}>
            {cls.class_name}
          </option>
        ))}
      </select>

      {/* Subject Selection */}
      <label className="block font-semibold mt-4">Subject</label>
      <select
        className="border p-2 w-full"
        onChange={(e) => setSelectedSubject(e.target.value)}
      >
        <option value="">Select Subject</option>
        {subjects.map((sub) => (
          <option key={sub.id} value={sub.subject_name}>
            {sub.subject_name}
          </option>
        ))}
      </select>

      {/* Chapter Selection */}
      <label className="block font-semibold mt-4">Chapter</label>
      <select
        className="border p-2 w-full"
        onChange={(e) => setSelectedChapter(e.target.value)}
      >
        <option value="">Select Chapter</option>
        {chapters.length > 0 ? (
          chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.chapter_name}
            </option>
          ))
        ) : (
          <option disabled>Loading chapters...</option>
        )}
      </select>

      {/* Question Type Selection */}
      <label className="block font-semibold mt-4">Question Type</label>
      <select
        className="border p-2 w-full"
        onChange={(e) => setSelectedQuestionType(e.target.value)}
      >
        <option value="">Select Question Type</option>
        {questionTypes.map((type) => (
          <option key={type.id} value={type.type_name}>
            {type.type_name}
          </option>
        ))}
      </select>

      {/* Generate Questions Button */}
      <button
        className="bg-blue-500 text-white p-2 rounded mt-4 w-full"
        onClick={handleGenerateQuestions}
      >
        Generate Questions
      </button>

      {/* Display Questions */}
      {questions.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-bold">Questions</h2>
          <ul className="border p-4 rounded list-none">
            {currentQuestions.map((q, index) => (
              <li key={q.id} className="mb-2 border-b p-2">
                {/* Question Number and Text */}
                <p className="font-bold">
                  {indexOfFirstQuestion + index + 1}. {q.question_text}
                </p>
                {q.question_type === "1" ? (
  <RenderMCQ q={q} />
) : q.question_type === "2" ? (
  <RenderMatchTables q={q} />
) : q.question_type === "11" ? (
  <DistinguishTable q={q} /> // Added DistinguishTable for Case 11
) : q.question_type === "16" ? (
  <RenderWrongPair q={q} /> // RenderWrongPair for Identify the Wrong Pair
) : ["3", "6", "7", "8", "12", "13", "14", "17", "18"].includes(q.question_type) ? (
  <QuestionWithAnswer q={q} />
) : (
  <p className="text-gray-500">Unknown question type</p>
)}


              </li>
            ))}
          </ul>

          {/* Pagination Controls */}
          <div className="flex justify-between mt-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="bg-gray-300 p-2 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-lg font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="bg-gray-300 p-2 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperGenerator;
