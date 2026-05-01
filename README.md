🧠 Virtual Memory Management Simulator (VMMS)
An interactive web-based simulator to visualize paging, page replacement algorithms, segmentation, and memory fragmentation in Operating Systems.
🚀 Overview
This project helps users understand how memory management works in OS through step-by-step simulation and visualization.
It includes:
Paging Simulator (FIFO, LRU, Optimal)
Segmentation Visualization
Fragmentation Analysis
Algorithm Comparison with Charts
✨ Features
🔹 Paging Simulator
Input custom page reference string
Select number of frames
Run:
FIFO (First In First Out)
LRU (Least Recently Used)
Optimal Algorithm
Step-by-step frame visualization
Shows:
Page Hits
Page Faults
Fault Rate & Hit Rate
🔹 Algorithm Comparison
Compare FIFO, LRU, and Optimal
Visual charts using Chart.js
Analyze performance differences
🔹 Segmentation
Define segments (Code, Stack, Heap, etc.)
View:
Base address
Limit
Memory allocation
Detect segmentation faults
🔹 Fragmentation
Simulate:
Internal Fragmentation
External Fragmentation
Calculate:
Memory wasted
Memory utilization
🧠 Concepts Covered
Paging
Page Replacement Algorithms
Page Hit & Page Fault
Demand Paging
Segmentation
Memory Fragmentation
⚙️ Technologies Used
HTML5
CSS3
JavaScript (Vanilla JS)
Chart.js (for visualization)
📂 Project Structure
📁 VMMS
 ├── index.html       # Main UI
 ├── main.css         # Styling
 ├── app.js           # UI Logic & Simulation Control
 ├── algorithms.js    # FIFO, LRU, Optimal logic
 ├── charts.js        # Graphs & Comparison
▶️ How to Run
Download or clone the repository:
git clone https://github.com/your-username/vmms.git
Open index.html in your browser

👉 No installation required

📊 Example Input
Frames = 3
Reference String = 7 0 1 2 0 3 0 4 2
🧩 Algorithms Explained
🔸 FIFO
Removes the oldest page in memory
Simple but not efficient
🔸 LRU
Removes the least recently used page
More efficient than FIFO
🔸 Optimal
Removes page used farthest in future
Gives minimum page faults (theoretical)
📌 Key Learnings
How memory is managed in OS
Impact of page replacement algorithms
Difference between theoretical and practical approaches
Visualization improves conceptual understanding
🎯 Future Improvements
Add more algorithms (LFU, Clock)
Add real-time performance metrics
Improve UI animations
Add user authentication for saving simulations
