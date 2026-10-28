/**
 * VisiOS — Subject-Aware Domain Knowledge Engine
 * Provides authentic, subject-specific pedagogical models for Computer Science,
 * Chemistry, Biology, Physics, and Mathematics with typo tolerance.
 * Ensures data structures are treated as memory/algorithmic models rather than Euclidean physics.
 */

import { VariableDescriptor, WorkedExample, PracticeQuestion } from './types';

export interface DomainSubjectResult {
  conceptId: string;
  category: 'algorithm' | 'physics' | 'chemistry' | 'algebra' | 'geometry' | 'calculus' | 'concept';
  subject: string;
  title: string;
  conciseFormula: string;
  solvedAnswer: string;
  intuition: string;
  realWorldApplication: string;
  prerequisites: string[];
  algebraicSteps: string[];
  geometricProofSummary: string;
  variables: VariableDescriptor[];
  calculatedParameters: Record<string, number>;
  assumptions: string[];
  workedExamples: WorkedExample[];
  practiceQuestions: PracticeQuestion[];
  nextConcepts: string[];
}

export class DomainKnowledgeEngine {
  /**
   * Normalizes input and tolerates common typos (e.g. "data strctures", "pythogoras").
   */
  public static normalizeTopic(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/strctures?/g, 'structures')
      .replace(/algrithms?/g, 'algorithms')
      .replace(/pythogoras?/g, 'pythagoras')
      .replace(/densiti/g, 'density')
      .replace(/volum/g, 'volume')
      .replace(/kinamatic/g, 'kinematic')
      .replace(/chemestry/g, 'chemistry')
      .replace(/bioligy/g, 'biology');
  }

  /**
   * Recognizes whether a user input belongs to a known domain concept.
   */
  public static match(rawInput: string): DomainSubjectResult | null {
    if (!rawInput) return null;
    const clean = this.normalizeTopic(rawInput);

    // ==========================================
    // 1. MATHEMATICS: TRANSCENDENTAL & TRIGONOMETRIC CURVES (y = e^(cos(x)), y = cos(x), y = sin(x), etc.)
    // ==========================================
    if (
      clean.includes('e^(cos(x))') ||
      clean.includes('e^cos(x)') ||
      clean.includes('exp(cos(x))') ||
      clean.includes('e^(sin(x))') ||
      clean.includes('e^sin(x)') ||
      (clean.includes('e^') && (clean.includes('cos') || clean.includes('sin')))
    ) {
      return this.getExpCosCurveModel();
    }

    if (
      clean.includes('e^x') ||
      clean.includes('y=e^x') ||
      clean.includes('y = e^x') ||
      clean.includes('exp(x)') ||
      clean.includes('exponential function') ||
      clean.includes('exponential curve') ||
      clean.includes('exponential growth') ||
      clean === 'exponential' ||
      clean === 'exp' ||
      (clean.includes('graph') && (clean.includes('e^') || clean.includes('exp')))
    ) {
      return this.getExponentialFunctionModel();
    }

    if (
      clean.includes('cos(x)') ||
      clean.includes('y=cos(x)') ||
      clean.includes('y = cos(x)') ||
      clean.includes('y=cosx') ||
      clean.includes('y = cosx') ||
      clean.includes('y=cos x') ||
      clean.includes('y = cos x') ||
      clean.includes('cosx') ||
      clean.includes('cos x') ||
      clean.includes('cosine curve') ||
      clean.includes('cosine function') ||
      clean.includes('cosine wave') ||
      clean.includes('graph of y=cosx') ||
      clean.includes('graph of y=cos') ||
      clean === 'cosine' ||
      clean === 'cos'
    ) {
      return this.getCosineFunctionModel();
    }

    if (
      clean.includes('sin(x)') ||
      clean.includes('y=sin(x)') ||
      clean.includes('y = sin(x)') ||
      clean.includes('y=sinx') ||
      clean.includes('y = sinx') ||
      clean.includes('y=sin x') ||
      clean.includes('y = sin x') ||
      clean.includes('sinx') ||
      clean.includes('sin x') ||
      clean.includes('sine curve') ||
      clean.includes('sine function') ||
      clean.includes('sine wave') ||
      clean.includes('graph of y=sinx') ||
      clean.includes('graph of y=sin') ||
      clean === 'sine' ||
      clean === 'sin'
    ) {
      return this.getSineFunctionModel();
    }

    // ==========================================
    // 1B. MATHEMATICS: LINEAR FUNCTIONS & FRACTIONS
    // ==========================================
    if (
      !clean.includes('cos') &&
      !clean.includes('sin') &&
      !clean.includes('^') &&
      !clean.includes('e^') &&
      (
        clean.includes('y=mx+c') ||
        clean.includes('y = mx + c') ||
        clean.includes('y=mx+b') ||
        clean.includes('y = mx + b') ||
        clean.includes('slope intercept') ||
        clean.includes('linear function') ||
        clean.includes('linear equation') ||
        /y\s*=\s*[-+]?\d*\.?\d*x/i.test(clean) ||
        (clean.includes('graph') && (clean.includes('mx') || clean.includes('slope') || (clean.includes('y=') && clean.includes('x')))) ||
        ((clean.includes('line') || clean.includes('slope')) && (clean.includes('intercept') || clean.includes('gradient')))
      )
    ) {
      let m = 2;
      let c = 1;
      const slopeMatch = clean.match(/([+-]?\d*\.?\d*)\s*x/);
      if (slopeMatch && slopeMatch[1]) {
        if (slopeMatch[1] === '-' || slopeMatch[1] === '') {
          m = slopeMatch[1] === '-' ? -1 : 1;
        } else {
          const val = parseFloat(slopeMatch[1]);
          if (!isNaN(val)) m = val;
        }
      }
      const interceptMatch = clean.match(/x\s*([+-]\s*\d+\.?\d*)/);
      if (interceptMatch && interceptMatch[1]) {
        const val = parseFloat(interceptMatch[1].replace(/\s+/g, ''));
        if (!isNaN(val)) c = val;
      }
      return this.getLinearFunctionModel(m, c);
    }

    if (
      clean === 'fraction' ||
      clean === 'fractions' ||
      clean.includes('rational number') ||
      clean.includes('equivalent fraction') ||
      clean.includes('numerator') ||
      clean.includes('denominator')
    ) {
      return this.getFractionsModel();
    }

    // ==========================================
    // 2. COMPUTER SCIENCE: DATA STRUCTURES & DSA
    // ==========================================
    if (
      clean.includes('python') ||
      clean.includes('programming') ||
      clean.includes('coding') ||
      clean.includes('scripting')
    ) {
      return this.getPythonProgrammingModel();
    }

    if (
      clean.includes('data structure') ||
      clean.includes('data structures') ||
      clean.includes('dsa') ||
      clean.includes('data_structure') ||
      clean === 'structures'
    ) {
      return this.getDataStructuresModel();
    }

    if (
      clean.includes('linked list') ||
      clean.includes('linkedlist') ||
      clean.includes('link list')
    ) {
      return this.getLinkedListModel();
    }

    if (
      clean.includes('stack') ||
      clean.includes('queue') ||
      clean.includes('lifo') ||
      clean.includes('fifo')
    ) {
      return this.getStackQueueModel();
    }

    if (
      clean.includes('hash table') ||
      clean.includes('hashmap') ||
      clean.includes('hash map') ||
      clean.includes('hashing')
    ) {
      return this.getHashTableModel();
    }

    if (
      clean.includes('trees & graphs') ||
      clean.includes('trees and graphs') ||
      clean.includes('tree data structure') ||
      clean.includes('graph data structure') ||
      clean.includes('binary tree') ||
      clean.includes('bst') ||
      clean.includes('graph theory') ||
      clean.includes('graph traversal') ||
      clean.includes('directed acyclic') ||
      clean.includes('dag') ||
      clean.includes('adjacency') ||
      clean.includes('breadth first') ||
      clean.includes('depth first') ||
      clean === 'tree' ||
      clean === 'trees' ||
      clean === 'graph' ||
      clean === 'graphs'
    ) {
      return this.getTreeGraphModel();
    }

    if (
      clean.includes('binary search') ||
      clean.includes('binarysearch') ||
      clean.includes('bsearch')
    ) {
      return this.getBinarySearchModel();
    }

    if (
      clean.includes('sorting') ||
      clean.includes('quicksort') ||
      clean.includes('mergesort') ||
      clean.includes('bubble sort')
    ) {
      return this.getSortingModel();
    }

    // ==========================================
    // 2. CHEMISTRY
    // ==========================================
    if (
      clean.includes('periodic table') ||
      clean.includes('chemical element') ||
      clean.includes('atomic number')
    ) {
      return this.getPeriodicTableModel();
    }

    if (
      clean.includes('ideal gas') ||
      clean.includes('pv = nrt') ||
      clean.includes('pv=nrt')
    ) {
      return this.getIdealGasModel();
    }

    if (
      clean.includes('chemical bond') ||
      clean.includes('chemical bonding') ||
      clean.includes('bonding') ||
      clean.includes('covalent') ||
      clean.includes('ionic bond')
    ) {
      return this.getChemicalBondingModel();
    }

    // ==========================================
    // 3. BIOLOGY & GENETICS
    // ==========================================
    if (
      clean.includes('photosynthesis') ||
      clean.includes('chlorophyll') ||
      clean.includes('chloroplast')
    ) {
      return this.getPhotosynthesisModel();
    }

    if (
      clean.includes('dna') ||
      clean.includes('rna') ||
      clean.includes('double helix') ||
      clean.includes('nucleotide')
    ) {
      return this.getDNAModel();
    }

    if (
      clean.includes('punnett') ||
      clean.includes('genetics') ||
      clean.includes('allele') ||
      clean.includes('dominant recessive')
    ) {
      return this.getPunnettSquareModel();
    }

    if (
      clean.includes('nervous system') ||
      clean.includes('nervous') ||
      clean.includes('brain') ||
      clean.includes('neuron') ||
      clean.includes('synapse') ||
      clean.includes('action potential') ||
      clean.includes('spine') ||
      clean.includes('neuroscience')
    ) {
      return this.getNervousSystemModel();
    }
    return null;
  }

  /**
   * Retrieves a domain model directly by its concept ID.
   */
  public static getByConceptId(conceptId: string): DomainSubjectResult | null {
    switch (conceptId) {
      case 'cs_python_programming':
        return this.getPythonProgrammingModel();
      case 'cs_data_structures':
        return this.getDataStructuresModel();
      case 'cs_linked_list':
        return this.getLinkedListModel();
      case 'cs_stack_queue':
        return this.getStackQueueModel();
      case 'cs_hash_table':
        return this.getHashTableModel();
      case 'cs_trees_graphs':
        return this.getTreeGraphModel();
      case 'cs_sorting_algorithms':
        return this.getSortingModel();
      case 'algo_binary_search':
        return this.getBinarySearchModel();
      case 'chem_periodic_table':
        return this.getPeriodicTableModel();
      case 'chem_ideal_gas':
        return this.getIdealGasModel();
      case 'chem_chemical_bonding':
        return this.getChemicalBondingModel();
      case 'bio_photosynthesis':
        return this.getPhotosynthesisModel();
      case 'bio_dna_structure':
        return this.getDNAModel();
      case 'bio_punnett_genetics':
        return this.getPunnettSquareModel();
      case 'bio_nervous_system':
        return this.getNervousSystemModel();
      case 'math_linear_function':
        return this.getLinearFunctionModel();
      case 'math_fractions':
        return this.getFractionsModel();
      case 'math_exp_cos_curve':
        return this.getExpCosCurveModel();
      case 'math_cosine_function':
        return this.getCosineFunctionModel();
      case 'math_sine_function':
        return this.getSineFunctionModel();
      default:
        return null;
    }
  }

  // -------------------------------------------------------------
  // Data Structures Model
  // -------------------------------------------------------------
  private static getDataStructuresModel(): DomainSubjectResult {
    return {
      conceptId: 'cs_data_structures',
      category: 'algorithm',
      subject: 'Computer Science: Data Structures & Algorithms',
      title: 'Data Structures: Memory Layout & Complexity Trade-offs',
      conciseFormula: 'Time vs Space Trade-off: T(n) vs S(n)',
      solvedAnswer: 'Linear (Array/List) & Hierarchical (Tree/Graph) memory abstractions',
      intuition:
        'Data structures are specialized memory formats designed to organize and manage data efficiently. The fundamental architectural decision is balancing read latency against write/mutation overhead: Arrays grant instant O(1) random access but require costly O(n) element shifts on insertion, whereas Linked Lists grant O(1) node insertion at the expense of sequential O(n) traversal.',
      realWorldApplication:
        'Database indexing (B+ Trees in MySQL/PostgreSQL), memory allocators (free lists in OS kernels), call stacks in JavaScript runtimes (LIFO), message queues in cloud microservices (FIFO), and routing networks in GPS engines (Graphs).',
      prerequisites: ['Memory Addressing & Pointers', 'Big-O Asymptotic Notation', 'Basic Data Types & Control Flow'],
      algebraicSteps: [
        '1. Categorize Storage Model: Linear (Arrays, Linked Lists, Stacks, Queues) vs Non-Linear (Trees, Graphs, Hash Tables)',
        '2. Continuous Memory Address Mapping: Array[i] = Base_Address + i * Element_Size enables instant O(1) random access',
        '3. Pointer-Linked Dynamic Heap Storage: Linked Nodes [Data | *Next] allocate memory on demand, enabling O(1) insertion at head/tail',
        '4. Direct Hash Indexing: Hash Tables map key → hash(key) % capacity to achieve amortized O(1) search, insert, and delete',
        '5. Hierarchical Space Partitioning: Balanced Binary Search Trees partition search space in half per level, guaranteeing O(log n) performance ✓',
      ],
      geometricProofSummary:
        'Memory Architecture Layout: Contiguous RAM indices [0..N-1] contrasted with heap nodes [Value | *NextPtr] connected via directed memory pointers. Call stack LIFO push/pop vs buffer FIFO enqueue/dequeue.',
      variables: [
        { symbol: 'N', name: 'Element Count', unit: 'elements', defaultValue: 10, min: 1, max: 1000, step: 1, description: 'Total number of items stored' },
        { symbol: 'arrayAccess', name: 'Array Access Cost', unit: 'O(1)', defaultValue: 1, min: 1, max: 1, step: 0, description: 'Direct index offset computation' },
        { symbol: 'listSearch', name: 'List Search Cost', unit: 'O(N)', defaultValue: 10, min: 1, max: 1000, step: 1, description: 'Sequential pointer traversal' },
        { symbol: 'treeSearch', name: 'BST Search Cost', unit: 'O(log N)', defaultValue: 3, min: 1, max: 10, step: 1, description: 'Binary tree search depth' },
      ],
      calculatedParameters: { N: 10, arrayAccess: 1, listSearch: 10, treeSearch: 3 },
      assumptions: [
        'Random Access Memory (RAM) model with uniform address read latency',
        'Finite memory allocation boundaries (heap/stack memory limits)',
        'Deterministic comparison and hashing operations',
      ],
      workedExamples: [
        {
          title: 'Optimal Data Structure Selection for Read-Heavy Workload',
          problemStatement: 'A stock trading feed performs 500,000 lookups per second by numerical ticker ID with rare insertions. Which data structure should be selected?',
          givenValues: { lookupFrequency: '500,000 / sec', mutationFrequency: 'Rare' },
          stepByStepSolution: [
            '1. Analyze operational requirements: System is heavily read-dominated (99.9% reads)',
            '2. Compare Array: Provides O(1) index lookups with high CPU cache spatial locality',
            '3. Compare Linked List: Requires O(n) pointer traversals with frequent CPU cache misses',
            '4. Decision: Array / contiguous memory buffer is the optimal choice.',
          ],
          finalAnswer: 'Array (O(1) random access with cache locality)',
        },
      ],
      practiceQuestions: [
        {
          id: 'ds_q1',
          question: 'Which data structure offers average O(1) time complexity for search, insertion, and deletion?',
          options: [
            'Hash Table (using a well-distributed hash function)',
            'Singly Linked List',
            'Unsorted Array',
            'Binary Search Tree',
          ],
          correctIndex: 0,
          explanation: 'Hash tables map keys directly to memory bucket indices via a hash function, achieving average O(1) operations.',
          hint: 'Think about mapping keys directly to array indices.',
        },
        {
          id: 'ds_q2',
          question: 'What is the primary advantage of a Singly Linked List over a fixed-size Array?',
          options: [
            'O(1) dynamic memory insertion and deletion at the head without resizing or shifting elements',
            'Faster O(1) random access to any arbitrary middle index',
            'Better CPU cache locality during sequential iteration',
            'Lower memory consumption because it has no pointer overhead',
          ],
          correctIndex: 0,
          explanation: 'Linked lists allocate nodes dynamically and insert at the head in O(1) by simply reassigning pointers, whereas arrays require allocating a larger buffer and shifting elements.',
          hint: 'Consider what happens when you insert an element at the beginning of an array vs a linked list.',
        },
      ],
      nextConcepts: [
        'Asymptotic Analysis: Big-O, Big-Omega, and Big-Theta notation',
        'Graph Algorithms: Dijkstra Shortest Path, BFS, and DFS',
        'Self-Balancing Trees: AVL Trees and Red-Black Trees',
        'Dynamic Programming & Memoization Techniques',
      ],
    };
  }

  // -------------------------------------------------------------
  // Linked List Model
  // -------------------------------------------------------------
  private static getLinkedListModel(): DomainSubjectResult {
    return {
      conceptId: 'cs_linked_list',
      category: 'algorithm',
      subject: 'Computer Science: Data Structures',
      title: 'Linked List: Dynamic Pointer-Chained Sequences',
      conciseFormula: 'Node = [Data, *NextPointer]',
      solvedAnswer: 'O(1) Head Insertion | O(n) Linear Traversal',
      intuition:
        'A linked list is a linear collection of data elements whose order is not given by their physical placement in memory. Instead, each element contains a pointer to the next element, enabling efficient insertion and deletion without memory reallocation.',
      realWorldApplication: 'Undo buffers in text editors, music playlist track navigation, OS memory block tracking (free lists).',
      prerequisites: ['Memory Pointers & Addresses', 'Dynamic Memory Allocation (Heap)'],
      algebraicSteps: [
        '1. Define Node Structure: struct Node { T data; Node* next; }',
        '2. Head Insertion: NewNode->next = Head; Head = NewNode (O(1) operations)',
        '3. Traversal: Current = Head; while (Current != null) { Current = Current->next } (O(n) steps)',
        '4. Deletion: PreviousNode->next = TargetNode->next; delete TargetNode (O(1) once node is located)',
      ],
      geometricProofSummary: 'Pointer-Chained Directed Graph: [Head] → [Node A | *] → [Node B | *] → [Node C | NULL].',
      variables: [
        { symbol: 'N', name: 'Nodes Count', unit: 'nodes', defaultValue: 5, min: 1, max: 100, step: 1, description: 'Length of linked chain' },
      ],
      calculatedParameters: { N: 5 },
      assumptions: ['Valid non-null pointer references', 'Heap allocation available'],
      workedExamples: [
        {
          title: 'Insert Node at Beginning of Linked List',
          problemStatement: 'Insert node with value 42 into linked list 10 -> 20 -> null.',
          givenValues: { newElement: 42, currentList: '10 -> 20' },
          stepByStepSolution: [
            '1. Allocate new node: Node(42)',
            '2. Point new node next to current head: Node(42)->next = Node(10)',
            '3. Update head pointer: Head = Node(42)',
          ],
          finalAnswer: '42 -> 10 -> 20 -> null (O(1) time)',
        },
      ],
      practiceQuestions: [
        {
          id: 'll_q1',
          question: 'What is the time complexity to access the k-th element in a singly linked list?',
          options: ['O(k) linear time', 'O(1) constant time', 'O(log k) logarithmic time', 'O(k²) quadratic time'],
          correctIndex: 0,
          explanation: 'Because linked list nodes are scattered in memory, you must traverse k pointers sequentially from the head.',
          hint: 'Can you jump directly to index k without following the intermediate next pointers?',
        },
      ],
      nextConcepts: ['Doubly Linked Lists', 'Circular Linked Lists', 'Skip Lists'],
    };
  }

  // -------------------------------------------------------------
  // Stack and Queue Model
  // -------------------------------------------------------------
  private static getStackQueueModel(): DomainSubjectResult {
    return {
      conceptId: 'cs_stack_queue',
      category: 'algorithm',
      subject: 'Computer Science: Data Structures',
      title: 'Stacks (LIFO) & Queues (FIFO): Ordered Buffers',
      conciseFormula: 'Stack: LIFO (Last In First Out) | Queue: FIFO (First In First Out)',
      solvedAnswer: 'Push/Pop O(1) | Enqueue/Dequeue O(1)',
      intuition:
        'Stacks and Queues enforce disciplined order of access. A stack operates like a stack of plates where the last item placed on top is the first removed (LIFO). A queue operates like a grocery checkout line where the first to arrive is the first served (FIFO).',
      realWorldApplication:
        'Stack: Syntax parsing (matching parentheses in compilers), call stack (recursion), browser history back-button. Queue: Print job spoolers, CPU process scheduling, BFS graph traversal.',
      prerequisites: ['Basic Array or Linked List implementation'],
      algebraicSteps: [
        '1. Stack Push: Insert item at top of stack (O(1))',
        '2. Stack Pop: Remove and return item from top of stack (O(1))',
        '3. Queue Enqueue: Insert item at rear of queue (O(1))',
        '4. Queue Dequeue: Remove and return item from front of queue (O(1))',
      ],
      geometricProofSummary: 'Buffer Model: Vertical LIFO tube open only at top vs horizontal FIFO conduit open at both ends.',
      variables: [
        { symbol: 'Capacity', name: 'Buffer Capacity', unit: 'slots', defaultValue: 16, min: 1, max: 256, step: 1, description: 'Maximum slots before overflow' },
      ],
      calculatedParameters: { Capacity: 16 },
      assumptions: ['Bounded memory buffers', 'Atomic push/pop operations in concurrency'],
      workedExamples: [
        {
          title: 'Parentheses Matching via Stack',
          problemStatement: 'Verify if expression "([{}])" has balanced parentheses.',
          givenValues: { expression: '([{}])' },
          stepByStepSolution: [
            '1. Scan characters left-to-right',
            '2. Push opening symbols: "(", "[", "{" onto stack',
            '3. On closing symbol "}", pop top: matches "{" ✓',
            '4. On closing symbol "]", pop top: matches "[" ✓',
            '5. On closing symbol ")", pop top: matches "(" ✓',
            '6. Stack is empty at conclusion ⇒ Balanced ✓',
          ],
          finalAnswer: 'Balanced Valid Syntax',
        },
      ],
      practiceQuestions: [
        {
          id: 'sq_q1',
          question: 'Which data structure is primarily used to implement Breadth-First Search (BFS) on a graph?',
          options: ['Queue (FIFO)', 'Stack (LIFO)', 'Max-Heap', 'Binary Search Tree'],
          correctIndex: 0,
          explanation: 'BFS explores vertices level by level, requiring vertices discovered first to be explored first, which is the definition of a FIFO queue.',
          hint: 'BFS explores level-by-level in arrival order.',
        },
      ],
      nextConcepts: ['Priority Queues (Heaps)', 'Double-Ended Queues (Deque)', 'Circular Ring Buffers'],
    };
  }

  // -------------------------------------------------------------
  // Hash Table Model
  // -------------------------------------------------------------
  private static getHashTableModel(): DomainSubjectResult {
    return {
      conceptId: 'cs_hash_table',
      category: 'algorithm',
      subject: 'Computer Science: Data Structures',
      title: 'Hash Tables: Key-Value Mapping & Direct Access',
      conciseFormula: 'Index = Hash(Key) mod Capacity',
      solvedAnswer: 'Average O(1) Search, Insert, and Delete',
      intuition:
        'Hash tables convert arbitrary keys (strings, objects, numbers) into an integer array index using a mathematical hash function, giving near-instantaneous O(1) lookup regardless of how large the dataset grows.',
      realWorldApplication: 'Python dictionaries, JavaScript object properties, database caching (Redis/Memcached), compiler symbol tables.',
      prerequisites: ['Arrays', 'Hash Functions', 'Modulo Arithmetic'],
      algebraicSteps: [
        '1. Compute 32-bit hash value: H = Hash(Key)',
        '2. Map hash into bucket array bounds: Bucket_Index = H % Table_Capacity',
        '3. Handle collisions: Chaining (linked list at each bucket) or Open Addressing (linear probing)',
        '4. Load Factor Management: When Load_Factor = N / Capacity > 0.75, double capacity and rehash all keys',
      ],
      geometricProofSummary: 'Hash Bucket Array: Keys map via hash function to discrete array slots [0..M-1] with collision linked lists.',
      variables: [
        { symbol: 'Capacity', name: 'Bucket Count', unit: 'buckets', defaultValue: 16, min: 4, max: 1024, step: 4, description: 'Total slots' },
        { symbol: 'N', name: 'Key Count', unit: 'keys', defaultValue: 10, min: 1, max: 500, step: 1, description: 'Items stored' },
      ],
      calculatedParameters: { Capacity: 16, N: 10 },
      assumptions: ['Uniform hash distribution across buckets', 'Negligible collision clustering'],
      workedExamples: [
        {
          title: 'Hash Table Bucket Index Calculation',
          problemStatement: 'Store key "apple" with hash code 938291 in table with 16 buckets.',
          givenValues: { key: 'apple', hash: 938291, capacity: 16 },
          stepByStepSolution: [
            '1. State formula: Index = Hash % Capacity',
            '2. Compute: 938291 % 16 = 11',
            '3. Place key-value pair in bucket 11.',
          ],
          finalAnswer: 'Bucket Index = 11',
        },
      ],
      practiceQuestions: [
        {
          id: 'ht_q1',
          question: 'What is the worst-case time complexity of searching in a hash table when all keys collide into the same bucket?',
          options: ['O(n) linear time', 'O(1) constant time', 'O(log n) logarithmic time', 'O(n²) quadratic time'],
          correctIndex: 0,
          explanation: 'If all keys hash to the same bucket, the collision chain degrades into a linear linked list of length n, requiring O(n) search.',
          hint: 'What does a bucket chain become if all items end up in the exact same linked list?',
        },
      ],
      nextConcepts: ['Cryptographic Hash Functions (SHA-256)', 'Consistent Hashing for Distributed Caches', 'Cuckoo Hashing'],
    };
  }

  // -------------------------------------------------------------
  // Tree and Graph Model
  // -------------------------------------------------------------
  private static getTreeGraphModel(): DomainSubjectResult {
    return {
      conceptId: 'cs_trees_graphs',
      category: 'algorithm',
      subject: 'Computer Science: Data Structures',
      title: 'Trees & Graphs: Hierarchical and Network Structures',
      conciseFormula: 'Tree: Acyclic Connected Graph (E = V - 1) | Graph: G = (V, E)',
      solvedAnswer: 'Binary Search Tree Lookup: O(log n) | Graph DFS/BFS: O(V + E)',
      intuition:
        'Trees represent parent-child hierarchies where every node has a single parent, while graphs generalize relationships to arbitrary networks of vertices connected by edges.',
      realWorldApplication: 'DOM tree in web browsers, file system directories, social media networks (friend graphs), internet routing (BGP).',
      prerequisites: ['Pointers & Recursion', 'Basic Set Theory'],
      algebraicSteps: [
        '1. Define Binary Search Tree property: Left_Subtree < Root < Right_Subtree',
        '2. Search Operation: If Key < Current->val, go Left; if Key > Current->val, go Right (cuts remaining space in half)',
        '3. Graph Representation: Adjacency List (memory efficient O(V + E)) or Adjacency Matrix (O(1) edge check, O(V²) space)',
        '4. Graph Traversal: BFS uses a Queue (shortest path in unweighted graphs); DFS uses Recursion/Stack (cycle detection)',
      ],
      geometricProofSummary: 'Hierarchical branching tree structure radiating from Root node, contrasted with interconnected network mesh.',
      variables: [
        { symbol: 'V', name: 'Vertices', unit: 'nodes', defaultValue: 15, min: 1, max: 1000, step: 1, description: 'Total nodes in structure' },
      ],
      calculatedParameters: { V: 15 },
      assumptions: ['Acyclic condition for trees', 'Connected components analysis'],
      workedExamples: [
        {
          title: 'Maximum Height of Balanced Binary Tree',
          problemStatement: 'Find maximum search depth for balanced BST containing 1024 elements.',
          givenValues: { nodes: 1024 },
          stepByStepSolution: [
            '1. State formula: Height = ⌊log₂(N)⌋',
            '2. Compute: log₂(1024) = 10',
            '3. Any element is found within at most 10 comparisons.',
          ],
          finalAnswer: 'Height = 10 comparisons',
        },
      ],
      practiceQuestions: [
        {
          id: 'tree_q1',
          question: 'What distinguishes a Tree from a general Graph?',
          options: [
            'A tree is a connected graph with no cycles (E = V - 1)',
            'Trees can only hold numerical data',
            'Graphs cannot have directed edges',
            'Trees cannot be traversed recursively',
          ],
          correctIndex: 0,
          explanation: 'A tree is formally defined as an undirected graph in which any two vertices are connected by exactly one path, meaning it is connected and has no cycles.',
          hint: 'Does a tree allow loops or cycles?',
        },
      ],
      nextConcepts: ['Trie (Prefix Trees)', 'Spanning Trees (Kruskal and Prim)', 'Network Flow Algorithms'],
    };
  }

  // -------------------------------------------------------------
  // Sorting Model
  // -------------------------------------------------------------
  private static getSortingModel(): DomainSubjectResult {
    return {
      conceptId: 'cs_sorting_algorithms',
      category: 'algorithm',
      subject: 'Computer Science: Algorithms',
      title: 'Sorting Algorithms: Divide-and-Conquer & Permutation',
      conciseFormula: 'Comparison Sort Lower Bound: Ω(n log n)',
      solvedAnswer: 'MergeSort: O(n log n) stable | QuickSort: O(n log n) avg',
      intuition:
        'Sorting arranges elements into numerical or lexicographical order. Theoretical information theory proves that any comparison-based sort must make at least log₂(n!) ≈ n log₂(n) comparisons in the worst case.',
      realWorldApplication: 'Database order-by queries, search engine ranking, graphics rendering z-buffering.',
      prerequisites: ['Arrays', 'Recursion', 'Logarithmic Division'],
      algebraicSteps: [
        '1. Divide: Split array of length n into two halves of length n/2',
        '2. Conquer: Recursively sort each sub-array',
        '3. Combine (Merge): Compare heads of both sorted arrays and merge into sorted order in O(n) time',
        '4. Recurrence Relation: T(n) = 2T(n/2) + O(n) ⇒ Master Theorem yields T(n) = O(n log n) ✓',
      ],
      geometricProofSummary: 'Recursion Tree: Depth log₂(n) levels, each level performing total n work, summing to n log n total operations.',
      variables: [
        { symbol: 'N', name: 'Array Size', unit: 'elements', defaultValue: 64, min: 2, max: 10000, step: 2, description: 'Number of elements to sort' },
      ],
      calculatedParameters: { N: 64 },
      assumptions: ['Total ordering relation holds (a <= b and b <= c => a <= c)'],
      workedExamples: [
        {
          title: 'MergeSort Operation Count',
          problemStatement: 'Estimate operations required to sort 1000 items with MergeSort.',
          givenValues: { N: 1000 },
          stepByStepSolution: [
            '1. State complexity: C ≈ N · log₂(N)',
            '2. Compute: 1000 · log₂(1000) ≈ 1000 · 9.97 ≈ 9970 operations',
            '3. In contrast, Bubble Sort O(N²) would require ~1,000,000 operations.',
          ],
          finalAnswer: '~10,000 operations (100x faster than O(N²))',
        },
      ],
      practiceQuestions: [
        {
          id: 'sort_q1',
          question: 'Why can comparison-based sorting algorithms not beat O(n log n) in the worst case?',
          options: [
            'Because there are n! possible permutations, requiring a decision tree of depth at least log₂(n!) = Ω(n log n)',
            'Because memory is too slow to read more than one element at a time',
            'Because CPU registers cannot store decimal numbers',
            'Because binary search only works on sorted arrays',
          ],
          correctIndex: 0,
          explanation: 'A comparison decision tree with n! leaves must have a height of at least log₂(n!) ≈ n log n - n log e = Ω(n log n).',
          hint: 'How many leaves does a binary decision tree need to distinguish all n! orderings?',
        },
      ],
      nextConcepts: ['Non-comparison sorting (Radix Sort, Counting Sort in O(n))', 'External Sort for Terabyte Data'],
    };
  }

  // -------------------------------------------------------------
  // Python & Programming Foundations Model
  // -------------------------------------------------------------
  private static getPythonProgrammingModel(): DomainSubjectResult {
    return {
      conceptId: 'cs_python_programming',
      category: 'algorithm',
      subject: 'Computer Science: Programming Foundations',
      title: 'Python: Syntax, Memory Execution & Data Models',
      conciseFormula: 'Object Reference Model | Bytecode Execution: Source → Bytecode (.pyc) → PVM',
      solvedAnswer: 'Dynamic Typing with High-Level Data Structures (Lists O(1) amortized, Dicts O(1) avg)',
      intuition:
        'Python treats all values as first-class heap-allocated objects and variables as name-to-object pointers. Code readability is enforced through significant whitespace indentation, eliminating syntactic boilerplate while providing rich standard libraries.',
      realWorldApplication:
        'Artificial intelligence and machine learning (PyTorch, TensorFlow), backend web APIs (FastAPI, Django), scientific computation (NumPy, SciPy), and automation scripting.',
      prerequisites: ['Variables & Memory Fundamentals', 'Algorithmic Thinking', 'Control Flow'],
      algebraicSteps: [
        '1. Name Binding: Assignment (x = 42) creates an integer object 42 on the heap and binds variable name x to its memory address.',
        '2. Control Flow: Indentation-scoped blocks evaluate conditionals (if/elif/else) and iterative loops (for item in iterable).',
        '3. Built-in Collections: Lists (dynamic arrays with O(1) append), Dictionaries (hash tables with O(1) amortized key lookup).',
        '4. Function Scope: Functions define isolated local namespaces with positional, keyword, and variadic arguments (*args, **kwargs).',
        '5. Memory Reclamation: Automatic reference counting supplemented by cyclic generational garbage collection.',
      ],
      geometricProofSummary:
        'Python Memory Graph: Stack frame containing local variable identifiers pointing via heap references to PyObject instances (type tag, reference count, payload).',
      variables: [
        { symbol: 'N', name: 'Elements', unit: 'items', defaultValue: 100, min: 1, max: 10000, step: 10, description: 'Number of elements processed in collection' },
      ],
      calculatedParameters: { N: 100 },
      assumptions: ['CPython reference implementation execution semantics', 'Automatic memory management (GIL & GC active)'],
      workedExamples: [
        {
          title: 'Dictionary Lookup Complexity vs List Linear Scan',
          problemStatement: 'Compare lookup performance between a Python dict (hash table) and Python list (array) of size N = 10,000.',
          givenValues: { collectionSize: 10000 },
          stepByStepSolution: [
            '1. In a Python list, searching for a value requires linear scanning (x in my_list) taking O(N) = 10,000 comparisons in the worst case.',
            '2. In a Python dict, keys are transformed via hash(key) directly into bucket indices, achieving average O(1) constant time lookup.',
            '3. At N = 10,000, dictionary lookups execute in roughly 1 operation vs up to 10,000 operations for lists.',
          ],
          finalAnswer: 'Dict lookup: O(1) constant time vs List lookup: O(N) linear time',
        },
      ],
      practiceQuestions: [
        {
          id: 'py_q1',
          question: 'In Python, what does the statement `b = a` perform when `a` is a list `[1, 2, 3]`?',
          options: [
            'Binds `b` to the exact same list object in memory (shared reference)',
            'Creates a deep independent duplicate copy of the list',
            'Converts the list into an immutable tuple',
            'Clears the contents of `a`',
          ],
          correctIndex: 0,
          explanation: 'In Python, assignment binds variable names to existing objects. `b = a` assigns `b` the same reference, so modifying `b` also mutates `a`.',
          hint: 'Does Python create a copy by default on assignment, or just point to the same object?',
        },
      ],
      nextConcepts: ['Object-Oriented Programming (Classes & Inheritance)', 'List Comprehensions & Generator Iterators', 'Binary Search & Algorithms in Python'],
    };
  }

  // -------------------------------------------------------------
  // Binary Search Model
  // -------------------------------------------------------------
  private static getBinarySearchModel(): DomainSubjectResult {
    return {
      conceptId: 'algo_binary_search',
      category: 'algorithm',
      subject: 'Computer Science: Algorithms',
      title: 'Binary Search: Logarithmic Divide-and-Conquer Search',
      conciseFormula: 'T(n) = T(n/2) + O(1) ⇒ O(log n)',
      solvedAnswer: 'Worst & Average Case Time Complexity: O(log n)',
      intuition:
        'Binary search efficiently locates a target item within a sorted array by repeatedly halving the search space. Because each comparison eliminates half the remaining elements, searching an array of size N takes at most ⌊log₂(N)⌋ + 1 steps.',
      realWorldApplication:
        'Database B-Tree indexing, Git bisect regression hunter, standard library searches, and IP routing table lookups.',
      prerequisites: ['Sorted Array (strictly monotonic)', 'Pointers and Array Indices', 'Logarithmic Division'],
      algebraicSteps: [
        '1. Initialize Pointers: low = 0, high = n - 1',
        '2. Compute Midpoint: mid = low + ⌊(high - low) / 2⌋',
        '3. Inspect Element: If Array[mid] == target, return index mid immediately',
        '4. Halve Search Space: If Array[mid] < target, set low = mid + 1; otherwise set high = mid - 1',
        '5. Recurrence Relation: T(n) = T(n/2) + O(1) ⇒ Master Theorem yields T(n) = O(log n) comparisons ✓',
      ],
      geometricProofSummary:
        'Binary Decision Tree: Search interval [low..high] bisected at each step, forming a decision tree of height ⌊log₂ n⌋ + 1.',
      variables: [
        { symbol: 'N', name: 'Array Size', unit: 'elements', defaultValue: 16, min: 2, max: 1024, step: 2, description: 'Number of elements in sorted array' },
        { symbol: 'target', name: 'Target Value', unit: 'value', defaultValue: 7, min: 1, max: 100, step: 1, description: 'Value sought in array' },
      ],
      calculatedParameters: { N: 16, target: 7 },
      assumptions: [
        'Precondition: Input array must be strictly sorted in monotonic ascending or descending order',
        'Random-access memory model with O(1) index addressing latency',
      ],
      workedExamples: [
        {
          title: 'Binary Search Step Count in 1,000,000 Element Array',
          problemStatement: 'What is the maximum number of comparisons required to locate a target in a sorted array of 1,000,000 elements?',
          givenValues: { N: 1000000 },
          stepByStepSolution: [
            '1. State complexity: Max comparisons = ⌊log₂(N)⌋ + 1',
            '2. Compute: log₂(1,000,000) ≈ 19.93',
            '3. Comparisons: 19 + 1 = 20 comparisons at most',
            '4. Contrast with linear search: 1,000,000 comparisons in the worst case (50,000x faster).',
          ],
          finalAnswer: 'At most 20 comparisons (O(log n) time)',
        },
      ],
      practiceQuestions: [
        {
          id: 'bs_q1',
          question: 'What is the mandatory prerequisite condition for binary search to function correctly?',
          options: [
            'The elements must be sorted in monotonic order',
            'The array must contain only positive integers',
            'The array size must be an exact power of two',
            'The elements must be linked via heap pointers',
          ],
          correctIndex: 0,
          explanation: 'Binary search relies on the monotonicity of sorted order to determine which half of the array can be safely eliminated.',
          hint: 'How does the algorithm know which direction to search without checking every element?',
        },
      ],
      nextConcepts: ['Exponential Search', 'Ternary Search', 'B-Trees & Multiway Search Trees'],
    };
  }

  // -------------------------------------------------------------
  // Periodic Table Model
  // -------------------------------------------------------------
  private static getPeriodicTableModel(): DomainSubjectResult {
    return {
      conceptId: 'chem_periodic_table',
      category: 'chemistry',
      subject: 'Chemistry: Atomic Structure',
      title: 'The Periodic Table: Electron Configuration & Periodicity',
      conciseFormula: 'Periodicity: Z (Atomic Number) = Protons = Electrons',
      solvedAnswer: 'Shell Filling Order: 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰',
      intuition:
        'The Periodic Table organizes chemical elements by increasing atomic number (number of protons). Elements in the same vertical column (Group) share identical valence electron configurations, producing recurring physical and chemical properties.',
      realWorldApplication: 'Semiconductor doping (Silicon group 14), battery chemistry (Lithium group 1), catalyst design (Transition metals).',
      prerequisites: ['Atomic Structure (Protons, Neutrons, Electrons)', 'Energy Shells'],
      algebraicSteps: [
        '1. Atomic Number (Z) = Number of protons in the nucleus',
        '2. Neutral atom rule: Electrons = Protons (Z)',
        '3. Aufbau Principle: Electrons fill lowest energy quantum subshells first (s, p, d, f)',
        '4. Valence Electrons: Outer-shell electrons determine electronegativity, reactivity, and bonding geometry ✓',
      ],
      geometricProofSummary: 'Periodic Grid: 7 horizontal periods (energy levels n=1..7) and 18 vertical groups (valence electron configurations).',
      variables: [
        { symbol: 'Z', name: 'Atomic Number', unit: 'protons', defaultValue: 6, min: 1, max: 118, step: 1, description: 'Element identifier (e.g. Carbon = 6)' },
      ],
      calculatedParameters: { Z: 6 },
      assumptions: ['Neutral ground-state atomic conditions'],
      workedExamples: [
        {
          title: 'Electron Configuration of Carbon (Z = 6)',
          problemStatement: 'Write the electron configuration and valence count for Carbon.',
          givenValues: { Z: 6 },
          stepByStepSolution: [
            '1. Fill 1s orbital: 1s² (2 electrons)',
            '2. Fill 2s orbital: 2s² (2 electrons)',
            '3. Fill 2p subshell: 2p² (2 electrons)',
            '4. Total outer shell (n=2): 2s² 2p² = 4 valence electrons.',
          ],
          finalAnswer: '1s² 2s² 2p² (4 Valence Electrons)',
        },
      ],
      practiceQuestions: [
        {
          id: 'chem_q1',
          question: 'Why do elements in the same vertical group exhibit similar chemical properties?',
          options: [
            'They have the same number of valence electrons in their outermost energy shell',
            'They have the exact same number of total neutrons',
            'They have identical atomic weights',
            'They all exist in the gas phase at room temperature',
          ],
          correctIndex: 0,
          explanation: 'Chemical bonding is determined by valence electrons. Having the same valence electron count produces identical bonding geometries.',
          hint: 'What part of the atom interacts during a chemical bond?',
        },
      ],
      nextConcepts: ['Electronegativity Trends', 'Ionic vs Covalent Bonding', 'VSEPR Molecular Geometry'],
    };
  }

  // -------------------------------------------------------------
  // Ideal Gas Law Model
  // -------------------------------------------------------------
  private static getIdealGasModel(): DomainSubjectResult {
    return {
      conceptId: 'chem_ideal_gas',
      category: 'chemistry',
      subject: 'Chemistry: Thermodynamics',
      title: 'Ideal Gas Law: P · V = n · R · T',
      conciseFormula: 'P · V = n · R · T',
      solvedAnswer: 'P = nRT / V  (R = 8.314 J/(mol·K))',
      intuition:
        'Relates the macroscopic thermodynamic state variables of a gas. Increasing temperature or mole quantity increases pressure, while expanding the volume reduces pressure.',
      realWorldApplication: 'Internal combustion engines, scuba tank pressure ratings, weather balloon expansion in upper atmosphere.',
      prerequisites: ['Temperature in Kelvin', 'Pressure in Pascals', 'Mole Concept'],
      algebraicSteps: [
        '1. Combine Boyle’s Law (P ∝ 1/V), Charles’s Law (V ∝ T), and Avogadro’s Law (V ∝ n)',
        '2. Formulate state equation: P · V = n · R · T',
        '3. Substitute gas constant R = 8.314 J/(mol·K)',
        '4. Solve for unknown state variable (P = nRT / V) ✓',
      ],
      geometricProofSummary: '3D PVT State Surface: Hyperbolic pressure-volume isotherms scaled by absolute temperature T.',
      variables: [
        { symbol: 'n', name: 'Moles', unit: 'mol', defaultValue: 1, min: 0.1, max: 10, step: 0.1, description: 'Gas amount' },
        { symbol: 'T', name: 'Temperature', unit: 'K', defaultValue: 298, min: 100, max: 1000, step: 5, description: 'Absolute temp' },
        { symbol: 'V', name: 'Volume', unit: 'm³', defaultValue: 0.024, min: 0.001, max: 0.1, step: 0.001, description: 'Enclosed volume' },
      ],
      calculatedParameters: { n: 1, T: 298, V: 0.024 },
      assumptions: ['Point particle approximation with zero molecular volume', 'Elastic collisions with zero intermolecular forces'],
      workedExamples: [
        {
          title: 'Calculate Pressure of 1 mole of gas at 300 K in 0.025 m³',
          problemStatement: 'Find pressure P for n=1 mol, T=300 K, V=0.025 m³.',
          givenValues: { n: 1, T: 300, V: 0.025 },
          stepByStepSolution: [
            '1. State equation: P = n · R · T / V',
            '2. Substitute: P = (1 · 8.314 · 300) / 0.025',
            '3. Calculate: P = 2494.2 / 0.025 = 99,768 Pa (~1 atm).',
          ],
          finalAnswer: 'P = 99.8 kPa (~1 atmosphere)',
        },
      ],
      practiceQuestions: [
        {
          id: 'gas_q1',
          question: 'If you double the absolute temperature T of a gas in a rigid container of fixed volume V, what happens to the pressure P?',
          options: ['Pressure doubles (2×)', 'Pressure halves (0.5×)', 'Pressure stays constant', 'Pressure quadruples (4×)'],
          correctIndex: 0,
          explanation: 'Since P = nRT/V with constant n, R, and V, pressure is directly proportional to absolute temperature.',
          hint: 'Look at the relation P ∝ T.',
        },
      ],
      nextConcepts: ['Van der Waals Equation for Real Gases', 'Kinetic Theory of Gases', 'Thermodynamic Carnot Cycles'],
    };
  }

  // -------------------------------------------------------------
  // DNA Model
  // -------------------------------------------------------------
  private static getDNAModel(): DomainSubjectResult {
    return {
      conceptId: 'bio_dna_structure',
      category: 'concept',
      subject: 'Biology: Molecular Genetics',
      title: 'DNA: The Double Helix & Genetic Code',
      conciseFormula: 'Base Pairing: A = T (2 H-bonds) | G ≡ C (3 H-bonds)',
      solvedAnswer: 'Antiparallel 5′ to 3′ Sugar-Phosphate Backbone',
      intuition:
        'Deoxyribonucleic acid (DNA) stores biological genetic information as a linear sequence of four nitrogenous bases (Adenine, Thymine, Guanine, Cytosine). Complementary hydrogen bonding between A-T and G-C allows reliable template-based replication.',
      realWorldApplication: 'CRISPR gene editing, forensic DNA fingerprinting, mRNA vaccine synthesis, evolutionary phylogenetics.',
      prerequisites: ['Hydrogen Bonding', 'Polymers & Nucleic Acids'],
      algebraicSteps: [
        '1. Nucleotide building block: Deoxyribose sugar + Phosphate group + Nitrogenous base',
        '2. Phosphodiester backbone: Forms covalent bonds linking 3′ carbon to 5′ carbon',
        '3. Chargaff’s Rule: Amount of A equals T; amount of G equals C (A=T, G=C)',
        '4. Antiparallel double strands: 5′→3′ strand pairs with 3′→5′ complementary strand ✓',
      ],
      geometricProofSummary: '3D Double Helix: Right-handed spiral with major and minor grooves, 10 base pairs per 3.4 nm full helical turn.',
      variables: [
        { symbol: 'basePairs', name: 'Base Pairs Count', unit: 'bp', defaultValue: 100, min: 10, max: 10000, step: 10, description: 'Length of sequence' },
      ],
      calculatedParameters: { basePairs: 100 },
      assumptions: ['Standard B-DNA conformation under physiological aqueous conditions'],
      workedExamples: [
        {
          title: 'Chargaff Ratio Calculation',
          problemStatement: 'A DNA sample contains 30% Adenine. What percentage of Cytosine is present?',
          givenValues: { Adenine: '30%' },
          stepByStepSolution: [
            '1. By Chargaff’s rule: %Thymine = %Adenine = 30%',
            '2. Total A + T = 30% + 30% = 60%',
            '3. Remaining G + C = 100% - 60% = 40%',
            '4. Since %G = %C: Cytosine = 40% / 2 = 20%.',
          ],
          finalAnswer: '20% Cytosine (and 20% Guanine)',
        },
      ],
      practiceQuestions: [
        {
          id: 'dna_q1',
          question: 'Why does the Guanine-Cytosine (G-C) pair have higher thermal stability than the Adenine-Thymine (A-T) pair?',
          options: [
            'G-C pairs are linked by 3 hydrogen bonds, while A-T pairs only have 2 hydrogen bonds',
            'G-C pairs have covalent bonds instead of hydrogen bonds',
            'A-T pairs repel each other with magnetic dipole moments',
            'Cytosine is twice as heavy as Thymine',
          ],
          correctIndex: 0,
          explanation: 'Guanine and Cytosine form 3 hydrogen bonds between their complementary donors and acceptors, requiring more thermal energy to denature.',
          hint: 'How many hydrogen bonds connect G-C vs A-T?',
        },
      ],
      nextConcepts: ['DNA Replication & Polymerase', 'Transcription to mRNA', 'Ribosomal Translation to Proteins'],
    };
  }

  // -------------------------------------------------------------
  // Punnett Square Model
  // -------------------------------------------------------------
  private static getPunnettSquareModel(): DomainSubjectResult {
    return {
      conceptId: 'bio_punnett_genetics',
      category: 'concept',
      subject: 'Biology: Mendelian Genetics',
      title: 'Mendelian Genetics: Punnett Squares & Inheritance',
      conciseFormula: 'Phenotypic Ratio: (B + b) × (B + b) = 1 BB : 2 Bb : 1 bb (3:1 Dominant:Recessive)',
      solvedAnswer: 'Genotypes: 25% BB, 50% Bb, 25% bb | Phenotypes: 75% Dominant, 25% Recessive',
      intuition:
        'A Punnett square is a visual 2D grid summarizing the probabilistic combinations of maternal and paternal gametes during sexual reproduction, showing the exact expected ratios of offspring genotypes and phenotypes.',
      realWorldApplication: 'Genetic counseling for hereditary disorders (Cystic Fibrosis, Sickle Cell), agricultural crop crossbreeding, animal pedigree breeding.',
      prerequisites: ['Meiosis & Gamete Segregation', 'Dominant vs Recessive Alleles'],
      algebraicSteps: [
        '1. Determine parental genotypes: Heterozygous Cross (Bb × Bb)',
        '2. Law of Segregation: Parents produce gametes B (50%) and b (50%)',
        '3. 2x2 Matrix Multiplication: (0.5 B + 0.5 b) × (0.5 B + 0.5 b)',
        '4. Genotypic Ratios: 0.25 BB + 0.50 Bb + 0.25 bb',
        '5. Phenotypic Ratios: 75% Dominant trait (BB + Bb), 25% Recessive trait (bb) ✓',
      ],
      geometricProofSummary: '2x2 Punnett Grid: Maternal gametes along rows, paternal gametes along columns, intersecting into 4 equal quadrants.',
      variables: [
        { symbol: 'offspringCount', name: 'Sample Offspring', unit: 'individuals', defaultValue: 100, min: 4, max: 1000, step: 4, description: 'Population sample size' },
      ],
      calculatedParameters: { offspringCount: 100 },
      assumptions: ['Complete dominance with no epistasis or polygenic interference', 'Independent assortment of unlinked loci'],
      workedExamples: [
        {
          title: 'Recessive Disease Carrier Cross',
          problemStatement: 'Two carriers of a recessive condition (genotype Nn) have a child. What is the probability the child is affected (nn)?',
          givenValues: { father: 'Nn', mother: 'Nn' },
          stepByStepSolution: [
            '1. Father gametes: 50% N, 50% n',
            '2. Mother gametes: 50% N, 50% n',
            '3. Probability of inheriting "n" from both parents: P(nn) = 0.5 × 0.5 = 0.25 (25%).',
          ],
          finalAnswer: '25% chance of affected child (nn)',
        },
      ],
      practiceQuestions: [
        {
          id: 'gen_q1',
          question: 'In a monohybrid cross between two heterozygous parents (Aa × Aa), what is the expected ratio of dominant to recessive phenotypes?',
          options: ['3 : 1', '1 : 2 : 1', '9 : 3 : 3 : 1', '1 : 1'],
          correctIndex: 0,
          explanation: 'Offspring genotypes are 1 AA, 2 Aa, 1 aa. Because both AA and Aa display the dominant phenotype, the phenotypic ratio is 3 dominant : 1 recessive.',
          hint: 'Remember that both AA and Aa exhibit the dominant appearance.',
        },
      ],
      nextConcepts: ['Dihybrid Crosses (9:3:3:1)', 'Incomplete Dominance & Codominance', 'Sex-Linked X-Chromosome Inheritance'],
    };
  }

  // -------------------------------------------------------------
  // Chemical Bonding Model
  // -------------------------------------------------------------
  private static getChemicalBondingModel(): DomainSubjectResult {
    return {
      conceptId: 'chem_chemical_bonding',
      category: 'chemistry',
      subject: 'Chemistry: Chemical Bonding & Structure',
      title: 'Chemical Bonding: Covalent, Ionic, and Polar Interactions',
      conciseFormula: 'Electronegativity Difference: ΔEN = |EN_A - EN_B|',
      solvedAnswer: 'Nonpolar Covalent (ΔEN < 0.4) vs Polar Covalent (0.4 ≤ ΔEN < 1.7) vs Ionic (ΔEN ≥ 1.7)',
      intuition:
        'Chemical bonds are attractive forces holding atoms together to form stable compounds. Driven by the thermodynamic drive to achieve noble-gas valence octets, metal-nonmetal pairs transfer electrons (Ionic bonds), nonmetal pairs share electrons (Covalent bonds), and differences in electronegativity induce bond dipole moments.',
      realWorldApplication:
        'Pharmaceutical drug-receptor binding, high-strength composite polymers (Kevlar), semiconductor crystalline lattices, and biomembrane lipid bilayers.',
      prerequisites: ['Valence Electrons & Octet Rule', 'Periodic Table & Electronegativity', 'Atomic Orbitals'],
      algebraicSteps: [
        '1. Determine valence electron count for each constituent element based on periodic group',
        '2. Calculate electronegativity difference: ΔEN = |EN_A - EN_B|',
        '3. Characterize bonding continuum: Nonpolar covalent (ΔEN < 0.4), Polar covalent (0.4 ≤ ΔEN < 1.7), Ionic (ΔEN ≥ 1.7)',
        '4. Assemble Lewis valence dot structure minimizing formal charges',
        '5. Apply VSEPR electron-pair repulsion to predict 3D molecular geometry ✓',
      ],
      geometricProofSummary:
        'Molecular Interaction Schematic: Electrostatic ionic attraction in salt lattices contrasted with orbital overlap electron density sharing in covalent bonds.',
      variables: [
        { symbol: 'deltaEN', name: 'Electronegativity Difference', unit: 'dimensionless', defaultValue: 0.96, min: 0.0, max: 3.5, step: 0.1, description: '|EN_A - EN_B|' },
        { symbol: 'bondOrder', name: 'Bond Order', unit: 'bonds', defaultValue: 1, min: 1, max: 3, step: 1, description: 'Number of shared electron pairs (single=1, double=2, triple=3)' },
      ],
      calculatedParameters: { deltaEN: 0.96, bondOrder: 1 },
      assumptions: [
        'Isolated gas or dilute solution molecular phase',
        'Octet rule strictly applies to period 2 nonmetals (C, N, O, F)',
      ],
      workedExamples: [
        {
          title: 'Bond Classification for Hydrogen Chloride (HCl)',
          problemStatement: 'Given electronegativities EN(H) = 2.20 and EN(Cl) = 3.16, determine bond type and polarity.',
          givenValues: { 'EN(H)': 2.2, 'EN(Cl)': 3.16 },
          stepByStepSolution: [
            '1. Compute difference: ΔEN = |3.16 - 2.20| = 0.96',
            '2. Compare against continuum: 0.40 ≤ 0.96 < 1.70',
            '3. Classify: Polar covalent bond with partial negative charge (δ⁻) on Chlorine and partial positive (δ⁺) on Hydrogen.',
          ],
          finalAnswer: 'Polar Covalent Bond (ΔEN = 0.96, Dipole moment directed toward Cl)',
        },
      ],
      practiceQuestions: [
        {
          id: 'bond_q1',
          question: 'Which factor primarily determines whether two bonded atoms form an ionic bond rather than a covalent bond?',
          options: [
            'A large difference in electronegativity (ΔEN ≥ 1.7)',
            'Identical atomic masses',
            'Number of core inner-shell electrons',
            'Zero temperature in Kelvin',
          ],
          correctIndex: 0,
          explanation: 'When electronegativity difference is large (typically ≥ 1.7), the more electronegative atom completely pulls the valence electron away, forming discrete positive and negative ions.',
          hint: 'Consider the ability of one atom to pull electrons away from another.',
        },
      ],
      nextConcepts: ['VSEPR Molecular Geometry', 'Intermolecular Hydrogen Bonding', 'Hybridization (sp, sp², sp³)'],
    };
  }

  // -------------------------------------------------------------
  // Photosynthesis Model
  // -------------------------------------------------------------
  private static getPhotosynthesisModel(): DomainSubjectResult {
    return {
      conceptId: 'bio_photosynthesis',
      category: 'concept',
      subject: 'Biology: Cellular Energetics & Photosynthesis',
      title: 'Photosynthesis: Light-Dependent Reactions & Carbon Fixation',
      conciseFormula: 'Net Biochemical Equation: 6 CO₂ + 6 H₂O + light energy → C₆H₁₂O₆ + 6 O₂',
      solvedAnswer: 'Two-Stage Conversion: Light Reactions (Thylakoid → ATP, NADPH, O₂) + Calvin Cycle (Stroma → Glucose)',
      intuition:
        'Photosynthesis is the fundamental bioenergetic pathway by which photoautotrophs convert radiant electromagnetic solar energy into stable chemical bond energy stored in glucose. Photosystem II and I harness photons to split water, generate an electrochemical proton gradient driving ATP synthase, and reduce NADP⁺ into NADPH, which then fuel CO₂ carbon fixation in the stroma.',
      realWorldApplication:
        'Global atmospheric oxygen maintenance, agricultural food yield optimization, carbon sequestration, and bio-inspired artificial photosynthetic solar cells.',
      prerequisites: ['Cellular Organelles (Chloroplasts)', 'Biochemical Energy Carriers (ATP & NADPH)', 'Electromagnetic Light Spectrum'],
      algebraicSteps: [
        '1. Photon Absorption: Chlorophyll a in Photosystem II absorbs photons (λ = 680 nm), exciting P680 electrons',
        '2. Photolysis of Water: 2 H₂O → 4 H⁺ + 4 e⁻ + O₂ released as a metabolic byproduct',
        '3. Electron Transport & Chemiosmosis: Cytochrome b6f pumps protons into thylakoid lumen; ATP synthase produces ATP',
        '4. NADPH Generation: Photosystem I (P700) re-excites electrons; Ferredoxin-NADP⁺ reductase yields NADPH',
        '5. Calvin Cycle (Carbon Fixation): Enzyme RuBisCO fixes CO₂ with RuBP into 3-PGA, reduced to G3P sugars using ATP and NADPH ✓',
      ],
      geometricProofSummary:
        'Chloroplast Organelle Architecture: Outer/inner double membrane enclosing fluid stroma containing stacked thylakoid grana discs hosting electron transport chains.',
      variables: [
        { symbol: 'co2Input', name: 'CO₂ Molecules', unit: 'molecules', defaultValue: 6, min: 1, max: 60, step: 1, description: 'Carbon dioxide reactant units' },
        { symbol: 'h2oInput', name: 'H₂O Molecules', unit: 'molecules', defaultValue: 6, min: 1, max: 60, step: 1, description: 'Water reactant units' },
      ],
      calculatedParameters: { co2Input: 6, h2oInput: 6 },
      assumptions: [
        'Optimal ambient photosynthetic photon flux density (400–700 nm photosynthetically active radiation)',
        'Sufficient stomatal conductance preventing RuBisCO oxygenase photorespiration',
      ],
      workedExamples: [
        {
          title: 'Stoichiometry of Glucose Synthesis in the Calvin Cycle',
          problemStatement: 'How many carbon dioxide molecules and turns of the Calvin cycle are required to synthesize one net 6-carbon glucose molecule?',
          givenValues: { 'CO₂ per turn': 1, 'Glucose carbons': 6 },
          stepByStepSolution: [
            '1. Each turn of the Calvin cycle incorporates 1 carbon atom from 1 CO₂ molecule',
            '2. Three turns produce 1 net molecule of glyceraldehyde 3-phosphate (G3P, 3 carbons)',
            '3. Two molecules of G3P (3 + 3 = 6 carbons) combine to form 1 glucose molecule (C₆H₁₂O₆)',
            '4. Total CO₂ required: 6 turns × 1 CO₂ = 6 CO₂ molecules.',
          ],
          finalAnswer: '6 CO₂ molecules and 6 cycle turns are required to synthesize 1 glucose molecule.',
        },
      ],
      practiceQuestions: [
        {
          id: 'photo_q1',
          question: 'Where do the light-dependent reactions of photosynthesis take place within a plant cell?',
          options: [
            'Across the thylakoid membrane of chloroplasts',
            'Inside the mitochondrial matrix',
            'Within the nuclear envelope',
            'In the extracellular cell wall',
          ],
          correctIndex: 0,
          explanation: 'The light-dependent reactions occur in the thylakoid membranes where Photosystems I and II, electron transport chains, and ATP synthase are embedded.',
          hint: 'Think about where the chlorophyll pigments and electron transport complexes are located in the chloroplast.',
        },
      ],
      nextConcepts: ['Cellular Respiration (Krebs Cycle)', 'C4 and CAM Plant Adaptations', 'Photorespiration & RuBisCO Efficiency'],
    };
  }

  // -------------------------------------------------------------
  // Linear Function Model (Slope-Intercept Form)
  // -------------------------------------------------------------
  private static getLinearFunctionModel(slope = 2, intercept = 1): DomainSubjectResult {
    const sign = intercept >= 0 ? '+' : '-';
    const absIntercept = Math.abs(intercept);
    const formulaStr = `y = ${slope}x ${sign} ${absIntercept}`;
    const xInt = slope !== 0 ? (-intercept / slope).toFixed(2) : 'None';
    return {
      conceptId: 'math_linear_functions',
      category: 'algebra',
      subject: 'Mathematics: Algebra & Coordinate Geometry',
      title: `Linear Function (Slope-Intercept Form): ${formulaStr}`,
      conciseFormula: formulaStr,
      solvedAnswer: `Slope m = ${slope}, Y-Intercept at (0, ${intercept}), X-Intercept at (${xInt}, 0)`,
      intuition:
        'A linear function models a constant rate of change. The slope m controls the line steepness and direction, while the intercept c shifts the line vertically on the Cartesian coordinate plane.',
      realWorldApplication:
        'Distance-time graphs under constant speed, cost-revenue break-even analysis, conversion formulas (e.g. F = 1.8C + 32), and machine learning linear regression.',
      prerequisites: ['Cartesian Coordinates (x, y)', 'Rate of Change', 'Solving Linear Equations'],
      algebraicSteps: [
        `1. State Slope-Intercept Equation: ${formulaStr} (where slope m = ${slope}, y-intercept c = ${intercept})`,
        `2. Gradient Formula: m = (y₂ - y₁) / (x₂ - x₁) = ${slope} (constant rate of change)`,
        `3. Find Y-Intercept: Set x = 0 → y = ${slope}(0) + ${intercept} = ${intercept} → point (0, ${intercept})`,
        `4. Find X-Intercept: Set y = 0 → 0 = ${slope}·x + ${intercept} → x = ${xInt}`,
        `5. Plot Coordinate Points: Connect (0, ${intercept}) and (1, ${slope + intercept}) with a continuous straight line across Cartesian plane`,
      ],
      geometricProofSummary:
        'A straight line on a 2D Cartesian plane formed by congruent right-angled rate triangles whose ratio of vertical change (rise) to horizontal change (run) is strictly constant.',
      variables: [
        { symbol: 'm', name: 'Slope (m)', unit: 'ratio', defaultValue: slope, min: -10, max: 10, step: 0.5, description: 'Rate of change / steepness of line' },
        { symbol: 'c', name: 'Y-Intercept (c)', unit: 'units', defaultValue: intercept, min: -10, max: 10, step: 0.5, description: 'Vertical axis intercept point (0, c)' },
        { symbol: 'x', name: 'Input (x)', unit: 'units', defaultValue: 1, min: -10, max: 10, step: 1, description: 'Independent coordinate value' },
      ],
      calculatedParameters: { m: slope, c: intercept, x: 1, y: slope * 1 + intercept },
      assumptions: [
        'Flat Euclidean 2D Cartesian plane with orthogonal x and y axes',
        'Non-vertical line (slope m is finite and well-defined)',
      ],
      workedExamples: [
        {
          title: 'Finding the Equation of a Line through Two Points',
          problemStatement: 'Find slope-intercept equation of line passing through (1, 3) and (3, 7).',
          givenValues: { x1: 1, y1: 3, x2: 3, y2: 7 },
          stepByStepSolution: [
            '1. Calculate slope: m = (7 - 3) / (3 - 1) = 4 / 2 = 2',
            '2. Substitute point (1, 3) into y = mx + c: 3 = 2(1) + c',
            '3. Solve for c: c = 3 - 2 = 1',
            '4. Final equation: y = 2x + 1',
          ],
          finalAnswer: 'y = 2x + 1 (Slope m = 2, Y-Intercept c = 1)',
        },
      ],
      practiceQuestions: [
        {
          id: 'linear_q1',
          question: 'In the equation y = -3x + 5, what does the value 5 represent?',
          options: [
            'The y-intercept: where the line crosses the y-axis at (0, 5)',
            'The slope of the line',
            'The x-intercept where the line crosses the x-axis',
            'The rate of change per unit x',
          ],
          correctIndex: 0,
          explanation: 'In slope-intercept form y = mx + c, the constant term c represents the y-intercept (0, c).',
          hint: 'What is the value of y when x = 0?',
        },
      ],
      nextConcepts: ['Point-Slope Form: y - y₁ = m(x - x₁)', 'Perpendicular and Parallel Lines', 'Systems of Linear Equations', 'Quadratic Curves (Parabolas)'],
    };
  }

  // -------------------------------------------------------------
  // Fractions & Rational Numbers Model
  // -------------------------------------------------------------
  private static getFractionsModel(): DomainSubjectResult {
    return {
      conceptId: 'math_fractions',
      category: 'algebra',
      subject: 'Mathematics: Arithmetic & Number Theory',
      title: 'Fractions & Rational Numbers: Part-to-Whole Relationships',
      conciseFormula: 'Fraction = Numerator (a) / Denominator (b), with b ≠ 0',
      solvedAnswer: 'Addition: a/b + c/d = (ad + bc)/bd | Multiplication: (a/b) · (c/d) = ac/bd',
      intuition:
        'A fraction represents one or more equal parts of a whole unit. The denominator defines how many equal partitions compose the whole, while the numerator counts how many of those partitions are selected.',
      realWorldApplication:
        'Culinary recipe scaling, financial percentages and interest rates, mechanical gear ratios, probability calculations, and musical time signatures.',
      prerequisites: ['Integer Counting & Division', 'Greatest Common Divisor (GCD)', 'Least Common Multiple (LCM)'],
      algebraicSteps: [
        '1. Rational Definition: a/b where a ∈ Z, b ∈ Z, and b ≠ 0',
        '2. Equivalent Fractions: (a · k) / (b · k) = a / b for any nonzero integer k',
        '3. Addition & Subtraction: Find common denominator: a/b ± c/d = (a·d ± b·c) / (b·d)',
        '4. Multiplication: Multiply numerators and denominators: (a/b) · (c/d) = (a·c) / (b·d)',
        '5. Division: Multiply by reciprocal: (a/b) ÷ (c/d) = (a/b) · (d/c) = (a·d) / (b·c) ✓',
      ],
      geometricProofSummary:
        'Area-proportional geometric decomposition: Circular pie sectors or segmented rectangular bars partitioned into b congruent regions with a shaded regions.',
      variables: [
        { symbol: 'numerator', name: 'Numerator (a)', unit: 'parts', defaultValue: 3, min: 1, max: 20, step: 1, description: 'Number of selected parts' },
        { symbol: 'denominator', name: 'Denominator (b)', unit: 'parts', defaultValue: 4, min: 1, max: 20, step: 1, description: 'Total equal parts composing whole' },
      ],
      calculatedParameters: { numerator: 3, denominator: 4, decimalValue: 0.75, percentage: 75 },
      assumptions: [
        'Denominator is strictly non-zero (division by zero is undefined)',
        'All partitions into the whole are identical in size/area',
      ],
      workedExamples: [
        {
          title: 'Adding Fractions with Different Denominators',
          problemStatement: 'Compute the sum of 1/3 and 2/5 and express in lowest terms.',
          givenValues: { frac1: '1/3', frac2: '2/5' },
          stepByStepSolution: [
            '1. Find least common denominator: LCM(3, 5) = 15',
            '2. Convert fractions: 1/3 = 5/15 and 2/5 = 6/15',
            '3. Add numerators: 5/15 + 6/15 = (5 + 6)/15 = 11/15',
            '4. Check lowest terms: GCD(11, 15) = 1, so 11/15 is irreducible.',
          ],
          finalAnswer: '1/3 + 2/5 = 11/15',
        },
      ],
      practiceQuestions: [
        {
          id: 'frac_q1',
          question: 'What is the reciprocal of the fraction 4/7?',
          options: ['7/4', '4/7', '-4/7', '1/7'],
          correctIndex: 0,
          explanation: 'The reciprocal of a fraction a/b is b/a (flipping numerator and denominator).',
          hint: 'Swap the numerator and denominator.',
        },
      ],
      nextConcepts: ['Decimals & Percentages', 'Mixed Numbers & Improper Fractions', 'Ratios and Proportions', 'Rational vs Irrational Numbers'],
    };
  }

  // -------------------------------------------------------------
  // Exponential Function Model: y = e^x
  // -------------------------------------------------------------
  private static getExponentialFunctionModel(): DomainSubjectResult {
    return {
      conceptId: 'math_exponential_function',
      category: 'calculus',
      subject: 'Mathematics: Coordinate Curves & Calculus',
      title: 'Exponential Function Analysis: y = e^x',
      conciseFormula: 'y = e^x',
      solvedAnswer: 'Strictly increasing convex curve, Domain: (-∞, ∞), Range: (0, ∞), Derivative: dy/dx = e^x',
      intuition:
        'The natural exponential function y = e^x represents continuous compounding growth where the rate of growth is directly proportional to its current value. At every point x, the slope of the tangent line equals the function value itself: dy/dx = y = e^x. It passes through the y-intercept (0, 1), approaches the horizontal asymptote y = 0 as x → -∞, and grows faster than any polynomial as x → +∞.',
      realWorldApplication:
        'Continuous compounding financial interest, biological population growth, viral epidemic spread kinetics, Newton\'s law of cooling, capacitor discharge in RC circuits, and carbon-14 radioactive decay.',
      prerequisites: ['Cartesian Coordinates (x, y)', 'Euler\'s Constant e ≈ 2.71828', 'Laws of Exponents', 'Limits & Derivatives'],
      algebraicSteps: [
        '1. Definition: y = e^x where e = lim(n→∞) (1 + 1/n)^n ≈ 2.7182818...',
        '2. Domain and Range: Defined for all real numbers x ∈ ℝ; range is strictly positive y ∈ (0, ∞)',
        '3. Fundamental Intercept: At x = 0, y = e^0 = 1 → y-intercept is (0, 1)',
        '4. Asymptotic Behavior: As x → -∞, e^x → 0 (horizontal asymptote at y = 0)',
        '5. Calculus Derivative: d/dx[e^x] = e^x (eigenfunction of differentiation) ✓',
      ],
      geometricProofSummary:
        'A smooth convex exponential curve in the upper Cartesian half-plane. Rises from the left horizontal asymptote y = 0, crosses (0, 1) with slope 1, and accelerates rapidly upward into steep growth.',
      variables: [
        { symbol: 'x', name: 'Coordinate (x)', unit: 'units', defaultValue: 1, min: -4, max: 4, step: 0.1, description: 'Exponent coordinate along horizontal axis' },
        { symbol: 'a', name: 'Amplitude Scale (a)', unit: 'dimensionless', defaultValue: 1, min: 0.1, max: 5, step: 0.1, description: 'Vertical scale factor in y = a · e^(kx)' },
        { symbol: 'k', name: 'Growth Rate (k)', unit: 'rate', defaultValue: 1, min: -3, max: 3, step: 0.1, description: 'Growth / decay rate constant in exponent' },
      ],
      calculatedParameters: { a: 1, k: 1, x: 1, y: 2.718 },
      assumptions: ['Standard base of natural logarithms e ≈ 2.71828', 'Continuous real domain x ∈ ℝ'],
      workedExamples: [
        {
          title: 'Evaluating y = e^x at Key Integers',
          problemStatement: 'Find values of y = e^x at x = -1, x = 0, and x = 2.',
          givenValues: { x_neg1: -1, x_0: 0, x_2: 2 },
          stepByStepSolution: [
            '1. At x = -1: y = e^(-1) = 1/e ≈ 0.368',
            '2. At x = 0: y = e^0 = 1 (Fundamental Y-Intercept)',
            '3. At x = 2: y = e^2 ≈ 7.389',
          ],
          finalAnswer: 'e^(-1) ≈ 0.368, e^0 = 1, e^2 ≈ 7.389',
        },
      ],
      practiceQuestions: [
        {
          id: 'exp_q1',
          question: 'What is the instantaneous rate of change (derivative) of y = e^x at x = 0?',
          options: ['1', '0', 'e (approx 2.718)', 'Undefined'],
          correctIndex: 0,
          explanation: 'The derivative of e^x is e^x. At x = 0, dy/dx = e^0 = 1.',
          hint: 'Remember that the derivative of e^x is itself.',
        },
      ],
      nextConcepts: ['Natural Logarithm: y = ln(x)', 'Exponential Decay Models', 'Differential Equations: dy/dt = ky', 'Taylor Series of e^x'],
    };
  }

  // -------------------------------------------------------------
  // Transcendental Exponential-Cosine Curve: y = e^(cos(x))
  // -------------------------------------------------------------
  private static getExpCosCurveModel(): DomainSubjectResult {
    return {
      conceptId: 'math_exp_cos_curve',
      category: 'calculus',
      subject: 'Mathematics: Coordinate Curves & Calculus',
      title: 'Transcendental Curve Analysis: y = e^(cos(x))',
      conciseFormula: 'y = e^(cos(x))',
      solvedAnswer: 'Periodic smooth wave, Range: [1/e, e] ≈ [0.368, 2.718], Period: 2π',
      intuition:
        'The function y = e^(cos(x)) is a smooth, continuous composite transcendental curve. It maps the bounded [-1, +1] oscillation of the trigonometric cosine function into the strictly positive exponential growth of Euler\'s number e. Consequently, y oscillates periodically between its global minimum y = e⁻¹ ≈ 0.368 and its global maximum y = e¹ ≈ 2.718 with a fundamental period of 2π.',
      realWorldApplication:
        'Frequency-modulated (FM) signal synthesis in electrical engineering, diurnal metabolic and temperature rhythm modeling in circadian biology, and non-sinusoidal wave propagation in acoustics.',
      prerequisites: [
        'Cartesian Coordinate Plane (x, y)',
        'Euler\'s Constant e & Exponential Functions',
        'Trigonometric Cosine Periodicity',
        'Chain Rule of Differential Calculus',
      ],
      algebraicSteps: [
        '1. Functional Composition: Define outer function f(u) = e^u and inner function u(x) = cos(x), yielding y = e^(cos(x))',
        '2. Domain & Periodicity: Cosine is periodic with T = 2π across all real numbers x ∈ ℝ, establishing that y(x + 2π) = y(x)',
        '3. Range Determination: Since -1 ≤ cos(x) ≤ 1 and e^u is strictly monotonically increasing: e⁻¹ ≤ y ≤ e¹, or y ∈ [1/e, e] ≈ [0.368, 2.718]',
        '4. First Derivative via Chain Rule: dy/dx = e^(cos(x)) · d/dx[cos(x)] = -sin(x) · e^(cos(x))',
        '5. Stationary & Critical Points: dy/dx = 0 when sin(x) = 0. Even multiples x = 2kπ yield maxima y = e; odd multiples x = (2k+1)π yield minima y = 1/e ✓',
      ],
      geometricProofSummary:
        'A strictly positive 2D Cartesian wave bounded between horizontal limits y = 1/e and y = e. Peaks occur at x = 0, ±2π with value e ≈ 2.72; valleys occur at x = ±π with value 1/e ≈ 0.37.',
      variables: [
        { symbol: 'x', name: 'Input Coordinate (x)', unit: 'rad', defaultValue: 0, min: -6.28, max: 6.28, step: 0.1, description: 'Angle in radians on the horizontal axis' },
        { symbol: 'minVal', name: 'Minimum Bound', unit: 'units', defaultValue: 0.368, min: 0.368, max: 0.368, step: 0, description: 'Minimum value e^(-1) ≈ 1/e' },
        { symbol: 'maxVal', name: 'Maximum Bound', unit: 'units', defaultValue: 2.718, min: 2.718, max: 2.718, step: 0, description: 'Maximum value e^(1) = e' },
      ],
      calculatedParameters: { minVal: 0.368, maxVal: 2.718, period: 6.283, x: 0, y: 2.718 },
      assumptions: [
        'Angles evaluated in standard radians (2π rad = 360°)',
        'Continuous domain x ∈ ℝ',
      ],
      workedExamples: [
        {
          title: 'Evaluating y = e^(cos(x)) at Peak and Trough',
          problemStatement: 'Find the exact value of y = e^(cos(x)) at x = 0 and x = π.',
          givenValues: { x0: 0, x1: 'π' },
          stepByStepSolution: [
            '1. At x = 0: cos(0) = 1 → y = e¹ = e ≈ 2.71828 (Global Maximum)',
            '2. At x = π: cos(π) = -1 → y = e⁻¹ = 1/e ≈ 0.36788 (Global Minimum)',
            '3. Evaluate average vertical height: (e + 1/e)/2 ≈ (2.718 + 0.368)/2 ≈ 1.543 = cosh(1)',
          ],
          finalAnswer: 'At x = 0: y = e ≈ 2.718; At x = π: y = 1/e ≈ 0.368',
        },
      ],
      practiceQuestions: [
        {
          id: 'exp_cos_q1',
          question: 'What is the exact derivative of y = e^(cos(x)) with respect to x?',
          options: [
            '-sin(x) · e^(cos(x))',
            'cos(x) · e^(sin(x))',
            'e^(cos(x))',
            '-cos(x) · e^(-sin(x))',
          ],
          correctIndex: 0,
          explanation: 'Applying the chain rule: d/dx[f(g(x))] = f\'(g(x)) · g\'(x). Here f(u) = e^u so f\'(u) = e^u, and g(x) = cos(x) so g\'(x) = -sin(x). Thus dy/dx = -sin(x) · e^(cos(x)).',
          hint: 'Remember the derivative of cos(x) is -sin(x).',
        },
      ],
      nextConcepts: [
        'Fourier Series Decomposition of Nonlinear Periodic Waves',
        'Logarithmic Differentiation Techniques',
        'Differential Equations with Periodic Coefficients',
      ],
    };
  }

  // -------------------------------------------------------------
  // Cosine Function Model: y = cos(x)
  // -------------------------------------------------------------
  private static getCosineFunctionModel(): DomainSubjectResult {
    return {
      conceptId: 'math_cosine_function',
      category: 'calculus',
      subject: 'Mathematics: Trigonometry & Analytic Geometry',
      title: 'Cosine Function Analysis: y = cos(x)',
      conciseFormula: 'y = cos(x)',
      solvedAnswer: 'Even periodic oscillation, Domain: (-∞, ∞), Range: [-1, 1], Period: 2π',
      intuition:
        'The cosine function is the fundamental horizontal coordinate projection of a point on the unit circle rotating with angular frequency. As angle x sweeps, cos(x) traces a smooth, even, 2π-periodic wave symmetric about the y-axis, with peaks of +1 at x = 0, ±2π and zeros at x = ±π/2, ±3π/2.',
      realWorldApplication:
        'AC electrical voltage and alternating current, harmonic oscillator displacement, mechanical wave propagation, and signal processing.',
      prerequisites: ['Cartesian Coordinates', 'Unit Circle Trigonometry', 'Radians vs Degrees'],
      algebraicSteps: [
        '1. Unit Circle Definition: cos(θ) = x-coordinate of point on circle of radius r = 1',
        '2. Even Symmetry: cos(-x) = cos(x) (reflectional symmetry about the vertical axis)',
        '3. Fundamental Period: cos(x + 2π) = cos(x) for all real x',
        '4. Zeros (X-Intercepts): cos(x) = 0 when x = π/2 + kπ for integer k',
        '5. Calculus Derivative: d/dx[cos(x)] = -sin(x) ✓',
      ],
      geometricProofSummary:
        'A horizontal projection on the unit circle translated into a Cartesian wave. Reaches maximum +1 at origin (0, 1), descending through (π/2, 0) to minimum -1 at (π, -1).',
      variables: [
        { symbol: 'x', name: 'Angle (x)', unit: 'rad', defaultValue: 0, min: -6.28, max: 6.28, step: 0.1, description: 'Phase angle in radians' },
        { symbol: 'A', name: 'Amplitude', unit: 'dimensionless', defaultValue: 1, min: 0.1, max: 5, step: 0.1, description: 'Peak deviation from zero' },
        { symbol: 'f', name: 'Frequency', unit: 'Hz', defaultValue: 1, min: 0.1, max: 10, step: 0.1, description: 'Number of wave cycles per unit distance or time' },
      ],
      calculatedParameters: { period: 6.283, amplitude: 1, x: 0, y: 1 },
      assumptions: ['Angles in radians', 'Euclidean unit circle with radius r = 1'],
      workedExamples: [
        {
          title: 'Finding Zeros of y = cos(x) in [0, 2π]',
          problemStatement: 'Find all x-intercepts of y = cos(x) on the interval [0, 2π].',
          givenValues: { interval: '[0, 2π]' },
          stepByStepSolution: [
            '1. Set y = 0: cos(x) = 0',
            '2. Unit circle x-coordinate equals 0 at top and bottom: x = π/2 and x = 3π/2',
            '3. Intercept points: (π/2, 0) ≈ (1.57, 0) and (3π/2, 0) ≈ (4.71, 0)',
          ],
          finalAnswer: 'x = π/2 and x = 3π/2',
        },
      ],
      practiceQuestions: [
        {
          id: 'cos_q1',
          question: 'What is the value of cos(0) and cos(π)?',
          options: ['cos(0) = 1, cos(π) = -1', 'cos(0) = 0, cos(π) = 1', 'cos(0) = -1, cos(π) = 1', 'cos(0) = 0, cos(π) = 0'],
          correctIndex: 0,
          explanation: 'At angle 0 radians, unit circle point is (1, 0) so cos(0) = 1. At angle π radians, point is (-1, 0) so cos(π) = -1.',
          hint: 'Think of the horizontal x-coordinate on the unit circle.',
        },
      ],
      nextConcepts: ['Sine and Tangent Functions', 'Trigonometric Identities (Pythagorean Identity)', 'Harmonic Fourier Transforms'],
    };
  }

  // -------------------------------------------------------------
  // Sine Function Model: y = sin(x)
  // -------------------------------------------------------------
  private static getSineFunctionModel(): DomainSubjectResult {
    return {
      conceptId: 'calculus_sin_x',
      category: 'calculus',
      subject: 'Mathematics: Trigonometry & Analytic Geometry',
      title: 'Sine Function Analysis: y = sin(x)',
      conciseFormula: 'y = sin(x)',
      solvedAnswer: 'Odd periodic oscillation, Domain: (-∞, ∞), Range: [-1, 1], Period: 2π',
      intuition:
        'The sine function represents the vertical coordinate projection of a point on the unit circle rotating counter-clockwise. It generates an odd, 2π-periodic sinusoidal wave passing directly through the origin (0, 0), with peaks of +1 at x = π/2 and troughs of -1 at x = 3π/2.',
      realWorldApplication:
        'Sound acoustics, electromagnetic radiation waves, ocean tides, and alternating current power generation.',
      prerequisites: ['Cartesian Coordinates', 'Unit Circle Trigonometry', 'Radians vs Degrees'],
      algebraicSteps: [
        '1. Unit Circle Definition: sin(θ) = y-coordinate of point on circle of radius r = 1',
        '2. Odd Symmetry: sin(-x) = -sin(x) (rotational 180° symmetry about origin)',
        '3. Fundamental Period: sin(x + 2π) = sin(x) for all real x',
        '4. Zeros (X-Intercepts): sin(x) = 0 when x = kπ for integer k',
        '5. Calculus Derivative: d/dx[sin(x)] = cos(x) ✓',
      ],
      geometricProofSummary:
        'A vertical projection on the unit circle translated into a Cartesian wave. Passes through origin (0, 0), peaks at (π/2, 1), crosses zero at (π, 0), reaches -1 at (3π/2, -1).',
      variables: [
        { symbol: 'x', name: 'Angle (x)', unit: 'rad', defaultValue: 1.57, min: -6.28, max: 6.28, step: 0.1, description: 'Phase angle in radians' },
        { symbol: 'A', name: 'Amplitude', unit: 'dimensionless', defaultValue: 1, min: 0.1, max: 5, step: 0.1, description: 'Peak deviation from zero' },
        { symbol: 'f', name: 'Frequency', unit: 'Hz', defaultValue: 1, min: 0.1, max: 10, step: 0.1, description: 'Number of wave cycles per unit distance or time' },
      ],
      calculatedParameters: { period: 6.283, amplitude: 1, x: 0, y: 0 },
      assumptions: ['Angles in radians', 'Euclidean unit circle with radius r = 1'],
      workedExamples: [
        {
          title: 'Finding the Amplitude and Period of y = sin(x)',
          problemStatement: 'State the amplitude, period, and range of standard y = sin(x).',
          givenValues: { function: 'y = sin(x)' },
          stepByStepSolution: [
            '1. Amplitude is the peak vertical deviation from center: A = 1',
            '2. Period is the distance along x for one complete cycle: T = 2π rad ≈ 6.283',
            '3. Range spans from trough to peak: [-1, 1]',
          ],
          finalAnswer: 'Amplitude = 1, Period = 2π, Range = [-1, 1]',
        },
      ],
      practiceQuestions: [
        {
          id: 'sin_q1',
          question: 'What is the derivative of y = sin(x)?',
          options: ['cos(x)', '-cos(x)', '-sin(x)', 'tan(x)'],
          correctIndex: 0,
          explanation: 'The instantaneous rate of change of the sine wave equals the cosine wave: d/dx[sin(x)] = cos(x).',
          hint: 'At x = 0, the sine curve is rising steeply at slope +1.',
        },
      ],
      nextConcepts: ['Cosine Function and Phase Shifts', 'Trigonometric Addition Formulas', 'Fourier Harmonic Series'],
    };
  }

  // -------------------------------------------------------------
  // Nervous System & Neurobiology Model
  // -------------------------------------------------------------
  private static getNervousSystemModel(): DomainSubjectResult {
    return {
      conceptId: 'bio_nervous_system',
      category: 'concept',
      subject: 'Biology: Human Anatomy & Neurobiology',
      title: 'The Nervous System: Neural Circuits & Action Potentials',
      conciseFormula: 'Membrane Potential: V_m = -70 mV (Resting) → +40 mV (Action Potential)',
      solvedAnswer: 'CNS (Brain + Spinal Cord) coordinates inputs; PNS relays sensory/motor signals via saltatory axonal transmission',
      intuition:
        'The nervous system is the master electro-chemical communication and control network of the human body. Sensory receptors convert environmental stimuli into graded potentials. When the axon hillock reaches threshold voltage (-55 mV), voltage-gated Na⁺ channels snap open, triggering an all-or-none action potential that propagates along myelinated axons to synaptic terminals, releasing neurotransmitters across the synaptic cleft.',
      realWorldApplication:
        'Neuroprosthetics and brain-computer interfaces (BCIs), pharmacological treatments for Parkinson\'s and Alzheimer\'s, anesthesia mechanisms (blocking voltage-gated sodium channels), and deep brain stimulation (DBS).',
      prerequisites: ['Cellular Structure & Organelles', 'Cell Membrane Transport & Ion Pumps (Na⁺/K⁺-ATPase)', 'Action Potential & Synaptic Transmission'],
      algebraicSteps: [
        '1. Resting Membrane Potential: Na⁺/K⁺ pump maintains negative intracellular potential (-70 mV)',
        '2. Depolarization to Threshold: Excitatory Postsynaptic Potentials (EPSPs) summate at axon hillock to reach -55 mV',
        '3. Rapid Depolarization: Voltage-gated Na⁺ channels open rapidly, allowing Na⁺ influx up to peak (+40 mV)',
        '4. Repolarization & Hyperpolarization: Inactivation of Na⁺ channels, delayed opening of voltage-gated K⁺ channels with K⁺ efflux',
        '5. Saltatory Conduction & Neurotransmission: Action potential jumps between Nodes of Ranvier to terminal boutons, triggering Ca²⁺ influx and exocytosis of neurotransmitters ✓',
      ],
      geometricProofSummary:
        'Three-dimensional hierarchical neural architecture: Central Nervous System (Cerebrum, Cerebellum, Brainstem, Spinal Cord) branching into 31 pairs of peripheral spinal nerves and cellular multipolar neurons with dendritic arbors and myelinated axons.',
      variables: [
        { symbol: 'V_rest', name: 'Resting Potential', unit: 'mV', defaultValue: -70, min: -90, max: -50, step: 1, description: 'Polarized membrane potential at rest' },
        { symbol: 'V_thresh', name: 'Firing Threshold', unit: 'mV', defaultValue: -55, min: -65, max: -45, step: 1, description: 'Critical depolarization voltage to trigger action potential' },
        { symbol: 'conductionVel', name: 'Conduction Velocity', unit: 'm/s', defaultValue: 100, min: 1, max: 120, step: 5, description: 'Saltatory speed along myelinated Aα nerve fibers' },
      ],
      calculatedParameters: { V_rest: -70, V_thresh: -55, V_peak: 40, conductionVel: 100 },
      assumptions: [
        'Electrochemical gradient governed by Nernst and Goldman-Hodgkin-Katz (GHK) equations',
        'All-or-none law applies: stimuli below threshold fail to generate an action potential',
      ],
      workedExamples: [
        {
          title: 'Patellar Reflex Arc (Monosynaptic Stretch Reflex)',
          problemStatement: 'Trace the neural pathway when the patellar tendon is tapped with a reflex hammer.',
          givenValues: { stimulus: 'Patellar tendon stretch', latency: '~25 ms' },
          stepByStepSolution: [
            '1. Muscle spindle receptors detect quadriceps stretch and fire action potentials.',
            '2. Afferent sensory neuron conveys signal through dorsal root ganglion into spinal cord segment L2–L4.',
            '3. Direct monosynaptic excitation of alpha motor neuron in spinal anterior grey horn (no brain loop required).',
            '4. Efferent motor axon propagates action potential back to quadriceps muscle fibers via saltatory conduction.',
            '5. Acetylcholine release at neuromuscular junction triggers quadriceps contraction and knee extension.',
          ],
          finalAnswer: 'Receptor → Sensory Neuron → Spinal Cord Synapse → Motor Neuron → Quadriceps Contraction',
        },
      ],
      practiceQuestions: [
        {
          id: 'neuro_q1',
          question: 'What crucial event occurs when the neuronal membrane potential reaches the threshold voltage (-55 mV)?',
          options: [
            'Voltage-gated Na⁺ channels snap open, triggering rapid depolarization',
            'The sodium-potassium pump permanently shuts down',
            'Neurotransmitters are destroyed in the synaptic cleft',
            'Myelin sheaths unravel from the axon',
          ],
          correctIndex: 0,
          explanation: 'Reaching the threshold potential of approximately -55 mV triggers the activation gates of voltage-gated Na⁺ channels to open, resulting in explosive influx of sodium ions and an all-or-none action potential.',
          hint: 'Think about which ion channels are voltage-gated and depolarize the cell.',
        },
      ],
      nextConcepts: ['Central Nervous System Functional Anatomy', 'Autonomic Nervous System (Sympathetic vs Parasympathetic)', 'Neurotransmitters & Synaptic Plasticity (LTP)'],
    };
  }
}

