"use client";

import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Button, TextField, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { Menu, Pencil, Trash2, X } from "lucide-react"; // Ensure correct imports for icons
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

// Helper function to save data to localStorage
const saveToLocalStorage = (key, value) => {
	localStorage.setItem(key, JSON.stringify(value));
};

// Helper function to get data from localStorage
const getFromLocalStorage = (key) => {
	return JSON.parse(localStorage.getItem(key));
};

export default function FlashcardApp() {
	const [flashcards, setFlashcards] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [savedData, setSavedData] = useState([]);
	const [selectedFile, setSelectedFile] = useState(null);
	const [editFileName, setEditFileName] = useState(null);
	const [newFileName, setNewFileName] = useState("");
	const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar toggle

	// Load saved files from localStorage on mount
	useEffect(() => {
		const saved = getFromLocalStorage("flashcardFiles") || [];
		setSavedData(saved);
	}, []);

	// Handle file upload and parse Excel data
	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			const data = new Uint8Array(e.target.result);
			const workbook = XLSX.read(data, { type: "array" });
			const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
			const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
				header: 1,
			});

			const cards = jsonData.map((row) => ({
				word: row[0],
				meaning: row[1],
			}));

			setFlashcards(shuffleArray(cards));
			setCurrentIndex(0);

			const newFileData = {
				name: file.name,
				cards,
			};

			const updatedData = [...savedData, newFileData];
			setSavedData(updatedData);
			saveToLocalStorage("flashcardFiles", updatedData);
			setSelectedFile(file.name);
		};
		reader.readAsArrayBuffer(file);
	};

	// Shuffle the cards randomly
	const shuffleArray = (array) => {
		return array.sort(() => Math.random() - 0.5);
	};

	// Navigation for previous and next flashcards
	const handleNext = () => {
		setIsFlipped(false);
		setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
	};

	const handlePrev = () => {
		setIsFlipped(false);
		setCurrentIndex((prevIndex) =>
			prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
		);
	};

	// Handle switching between different saved files
	const handleSelectSavedData = (fileName) => {
		const selectedData = savedData.find((data) => data.name === fileName);
		setFlashcards(shuffleArray(selectedData.cards));
		setCurrentIndex(0);
		setIsFlipped(false);
		setSelectedFile(fileName);
		setIsSidebarOpen(false); // Close the sidebar when a file is selected
	};

	// Rename a saved file
	const handleRenameFile = (oldName, newName) => {
		const updatedData = savedData.map((data) =>
			data.name === oldName ? { ...data, name: newName } : data
		);
		setSavedData(updatedData);
		saveToLocalStorage("flashcardFiles", updatedData);
		setEditFileName(null);
		setNewFileName("");
	};

	// Remove a saved file
	const handleRemoveFile = (fileName) => {
		const updatedData = savedData.filter((data) => data.name !== fileName);
		setSavedData(updatedData);
		saveToLocalStorage("flashcardFiles", updatedData);
		if (selectedFile === fileName) {
			setFlashcards([]);
			setCurrentIndex(0);
			setSelectedFile(null);
		}
	};

	return (
		<div className="flex min-h-screen">
			{/* Toggle button for mobile */}

			{/* Left Navigation Bar */}
			<div
				className={`fixed md:relative top-20 md:top-0 z-10 transition-transform duration-300 transform bg-gray-800 p-4 text-white ${
					isSidebarOpen ? "translate-x-0 " : "-translate-x-full"
				} md:translate-x-0 w-64 md:w-1/4`}
			>
				<Button
					variant="contained"
					component="label"
					color="primary"
					className="mb-4 w-full rounded-xl"
				>
					Upload Excel File
					<input
						type="file"
						accept=".xlsx,.xls"
						hidden
						onChange={handleFileUpload}
					/>
				</Button>

				{/* List of saved files */}
				<div>
					<h2 className="text-lg mb-4">Saved Files</h2>
					{savedData.map((data, index) => (
						<div key={index} className="flex items-center mb-2">
							{editFileName === data.name ? (
								<div className="flex flex-col w-full">
									<TextField
										value={newFileName}
										onChange={(e) =>
											setNewFileName(e.target.value)
										}
										className="mb-2 bg-white text-black"
									/>
									<Button
										variant="contained"
										color="primary"
										onClick={() =>
											handleRenameFile(
												data.name,
												newFileName
											)
										}
									>
										Save
									</Button>
									<Button
										variant="contained"
										color="secondary"
										onClick={() => setEditFileName(null)}
										className="mt-2"
									>
										Cancel
									</Button>
								</div>
							) : (
								<div
									className={`flex justify-between w-full items-center cursor-pointer p-2 px-4 rounded-xl ${
										selectedFile === data.name
											? "bg-blue-500"
											: "bg-gray-700 hover:bg-gray-600"
									}`}
									onClick={() =>
										handleSelectSavedData(data.name)
									}
								>
									{data.name}
									<div className="flex items-center">
										<IconButton
											color="default"
											onClick={(e) => {
												e.stopPropagation();
												setEditFileName(data.name);
												setNewFileName(data.name);
											}}
											className="hover:bg-orange-500"
										>
											<Pencil />
										</IconButton>
										<IconButton
											color="default"
											onClick={(e) => {
												e.stopPropagation();
												handleRemoveFile(data.name);
											}}
											className="hover:bg-red-500"
										>
											<Trash2 />
										</IconButton>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Overlay for mobile to close sidebar */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-5 bg-black opacity-50 md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* Main Flashcard Display Area */}
			<div className="flex-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex flex-col items-center justify-center">
				<div className="md:hidden p-4 absolute top-4 left-4 z-20">
					<IconButton
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
					>
						{isSidebarOpen ? (
							<X className="text-black" />
						) : (
							<Menu className="text-black" />
						)}
						{/* <Menu className="text-black" /> */}
					</IconButton>
				</div>
				<h1 className="text-4xl font-extrabold text-white mb-8">
					Flashcard App
				</h1>

				{/* Flashcard display */}
				{flashcards.length > 0 && (
					<div className="mt-8 w-full max-w-md flex flex-col items-center">
						{/* Card with Flip Animation */}
						<motion.div
							className="relative w-96 h-96"
							style={{
								perspective: "1000px",
							}}
						>
							<motion.div
								className={`relative w-full h-full rounded-xl shadow-lg transform transition-transform duration-300`}
								style={{
									transformStyle: "preserve-3d",
								}}
								animate={{
									rotateY: isFlipped ? 180 : 0,
								}}
								onClick={() => setIsFlipped(!isFlipped)}
							>
								{/* Front Side - Word */}
								<div
									className="absolute w-full h-full bg-white flex items-center justify-center rounded-xl border border-gray-300 p-6"
									style={{
										backfaceVisibility: "hidden",
									}}
								>
									<CardHeader className="text-3xl font-bold text-gray-800">
										{flashcards[currentIndex].word}
									</CardHeader>
									{/* <CardDescription className="text-gray-500 mt-4">
										Click to see the meaning
									</CardDescription> */}
								</div>

								{/* Back Side - Meaning */}
								<div
									className="absolute w-full h-full bg-gray-200 flex items-center justify-center rounded-xl border border-gray-300 p-6"
									style={{
										backfaceVisibility: "hidden",
										transform: "rotateY(180deg)",
									}}
								>
									<CardHeader className="text-xl text-gray-800">
										{flashcards[currentIndex].meaning}
									</CardHeader>
								</div>
							</motion.div>
						</motion.div>

						{/* Previous and Next Buttons */}
						<div className="flex justify-between mt-6 w-full max-w-md p-4">
							<Button
								variant="contained"
								color="primary"
								onClick={handlePrev}
							>
								Previous
							</Button>
							<Button
								variant="contained"
								color="secondary"
								onClick={handleNext}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ******************************

// "use client";

// import { Card, CardHeader, CardDescription } from "@/components/ui/card";
// import { Button, TextField, IconButton } from "@mui/material";
// import { motion } from "framer-motion";
// import { Pencil, Trash2 } from "lucide-react";
// import { useState, useEffect } from "react";
// import * as XLSX from "xlsx";
// // import DeleteIcon from "@mui/icons-material/Delete";
// // import EditIcon from "@mui/icons-material/Edit";

// // Helper function to save data to localStorage
// const saveToLocalStorage = (key, value) => {
//   localStorage.setItem(key, JSON.stringify(value));
// };

// // Helper function to get data from localStorage
// const getFromLocalStorage = (key) => {
//   return JSON.parse(localStorage.getItem(key));
// };

// export default function FlashcardApp() {
//   const [flashcards, setFlashcards] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isFlipped, setIsFlipped] = useState(false);
//   const [savedData, setSavedData] = useState([]);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [editFileName, setEditFileName] = useState(null);
//   const [newFileName, setNewFileName] = useState("");

//   // Load saved files from localStorage on mount
//   useEffect(() => {
//     const saved = getFromLocalStorage("flashcardFiles") || [];
//     setSavedData(saved);
//   }, []);

//   // Handle file upload and parse Excel data
//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const data = new Uint8Array(e.target.result);
//       const workbook = XLSX.read(data, { type: "array" });
//       const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
//       const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

//       const cards = jsonData.map((row) => ({
//         word: row[0],
//         meaning: row[1],
//       }));

//       setFlashcards(shuffleArray(cards));
//       setCurrentIndex(0);

//       const newFileData = {
//         name: file.name,
//         cards,
//       };

//       const updatedData = [...savedData, newFileData];
//       setSavedData(updatedData);
//       saveToLocalStorage("flashcardFiles", updatedData);
//       setSelectedFile(file.name);
//     };
//     reader.readAsArrayBuffer(file);
//   };

//   // Shuffle the cards randomly
//   const shuffleArray = (array) => {
//     return array.sort(() => Math.random() - 0.5);
//   };

//   // Navigation for previous and next flashcards
//   const handleNext = () => {
//     setIsFlipped(false);
//     setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
//   };

//   const handlePrev = () => {
//     setIsFlipped(false);
//     setCurrentIndex((prevIndex) =>
//       prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
//     );
//   };

//   // Handle switching between different saved files
//   const handleSelectSavedData = (fileName) => {
//     const selectedData = savedData.find((data) => data.name === fileName);
//     setFlashcards(shuffleArray(selectedData.cards));
//     setCurrentIndex(0);
//     setIsFlipped(false);
//     setSelectedFile(fileName);
//   };

//   // Rename a saved file
//   const handleRenameFile = (oldName, newName) => {
//     const updatedData = savedData.map((data) =>
//       data.name === oldName ? { ...data, name: newName } : data
//     );
//     setSavedData(updatedData);
//     saveToLocalStorage("flashcardFiles", updatedData);
//     setEditFileName(null);
//     setNewFileName("");
//   };

//   // Remove a saved file
//   const handleRemoveFile = (fileName) => {
//     const updatedData = savedData.filter((data) => data.name !== fileName);
//     setSavedData(updatedData);
//     saveToLocalStorage("flashcardFiles", updatedData);
//     if (selectedFile === fileName) {
//       setFlashcards([]);
//       setCurrentIndex(0);
//       setSelectedFile(null);
//     }
//   };

//   return (
//     <div className="flex min-h-screen">
//       {/* Left Navigation Bar */}
//       <div className="w-1/4 bg-gray-800 p-4 text-white">
//         <Button
//           variant="contained"
//           component="label"
//           color="primary"
//           className="mb-4 w-full rounded-xl"
//         >
//           Upload Excel File
//           <input
//             type="file"
//             accept=".xlsx,.xls"
//             hidden
//             onChange={handleFileUpload}
//           />
//         </Button>

//         {/* List of saved files */}
//         <div>
//           <h2 className="text-lg mb-4">Saved Files</h2>
//           {savedData.map((data, index) => (
//             <div key={index} className="flex items-center mb-2">
//               {editFileName === data.name ? (
//                 <div className="flex flex-col w-full">
//                   <TextField
//                     // label="File Name"
//                     value={newFileName}
//                     onChange={(e) => setNewFileName(e.target.value)}
//                     className="mb-2 bg-white text-black"
//                   />
//                   <Button
//                     variant="contained"
//                     color="primary"
//                     onClick={() => handleRenameFile(data.name, newFileName)}
//                   >
//                     Save
//                   </Button>
//                   <Button
//                     variant="contained"
//                     color="secondary"
//                     onClick={() => setEditFileName(null)}
//                     className="mt-2"
//                   >
//                     Cancel
//                   </Button>
//                 </div>
//               ) : (
//                 <div
//                   className={`flex justify-between w-full items-center cursor-pointer p-2 px-4 rounded-xl ${
//                     selectedFile === data.name
//                       ? "bg-blue-500"
//                       : "bg-gray-700 hover:bg-gray-600"
//                   }`}
//                   onClick={() => handleSelectSavedData(data.name)}
//                 >
//                   {data.name}
//                   <div className="flex items-center">
//                     <IconButton
//                       color="default"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         setEditFileName(data.name);
//                         setNewFileName(data.name);
//                       }}
//                         className="hover:bg-orange-500"
//                     >
//                       <Pencil />
//                     </IconButton>
//                     <IconButton
//                       color="default"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleRemoveFile(data.name);
//                       }}
//                         className="hover:bg-red-500"
//                     >
//                       <Trash2 />
//                     </IconButton>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Flashcard Display Area */}
//       <div className="flex-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex flex-col items-center justify-center">
//         <h1 className="text-4xl font-extrabold text-white mb-8">Flashcard App</h1>

//         {/* Flashcard display */}
//         {flashcards.length > 0 && (
//           <div className="mt-8 w-full max-w-md flex flex-col items-center">
//             {/* Card with Flip Animation */}
//             <motion.div
//               className="relative w-96 h-96"
//               style={{
//                 perspective: "1000px",
//               }}
//             >
//               <motion.div
//                 className={`relative w-full h-full rounded-xl shadow-lg transform transition-transform duration-300`}
//                 style={{
//                   transformStyle: "preserve-3d",
//                 }}
//                 animate={{
//                   rotateY: isFlipped ? 180 : 0,
//                 }}
//                 onClick={() => setIsFlipped(!isFlipped)}
//               >
//                 {/* Front Side - Word */}
//                 <div
//                   className="absolute w-full h-full bg-white flex items-center justify-center rounded-xl border border-gray-300 p-6"
//                   style={{
//                     backfaceVisibility: "hidden",
//                   }}
//                 >
//                   <CardDescription className="text-3xl font-bold text-gray-900">
//                     {flashcards[currentIndex].word}
//                   </CardDescription>
//                 </div>
//                 {/* Back Side - Meaning */}
//                 <div
//                   className="absolute w-full h-full bg-gray-200 flex items-center justify-center rounded-xl border border-gray-300 p-6"
//                   style={{
//                     backfaceVisibility: "hidden",
//                     transform: "rotateY(180deg)",
//                   }}
//                 >
//                   <CardHeader className="text-xl text-gray-800">
//                     {flashcards[currentIndex].meaning}
//                   </CardHeader>
//                 </div>
//               </motion.div>
//             </motion.div>
//             {/* Previous and Next Buttons */}
//             <div className="flex justify-between mt-6 w-full max-w-md">
//               <Button variant="contained" color="primary" onClick={handlePrev}>
//                 Previous
//               </Button>
//               <Button variant="contained" color="secondary" onClick={handleNext}>
//                 Next
//               </Button>
//             </div>
//             {/* Progress Indicator */}
//             {/* <div className="mt-4 text-white">
//               Flashcard {currentIndex + 1} of {flashcards.length}
//             </div> */}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
