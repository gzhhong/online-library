import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'react-hot-toast';
import dagre from 'dagre';

// 自定义节点组件
const IndustryNode = ({ data, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editDescription, setEditDescription] = useState(data.description || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleEdit = async () => {
    if (!editTitle.trim()) {
      toast.error('标题不能为空');
      return;
    }

    try {
      const response = await fetch('/api/matchlawyer/industries/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: data.id,
          title: editTitle,
          description: editDescription,
          parentId: data.parentId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        data.onUpdate(result.data);
        setIsEditing(false);
        toast.success('更新成功');
      } else {
        const error = await response.json();
        toast.error(error.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个标签吗？这将同时删除所有子标签。')) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/industries/delete?id=${data.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        data.onDelete(data.id);
        toast.success('删除成功');
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleAddChild = async () => {
    if (!newTitle.trim()) {
      toast.error('标题不能为空');
      return;
    }

    try {
      const response = await fetch('/api/matchlawyer/industries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          parentId: data.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        data.onAddChild(result.data);
        setShowAddForm(false);
        setNewTitle('');
        setNewDescription('');
        toast.success('添加成功');
      } else {
        const error = await response.json();
        toast.error(error.error || '添加失败');
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg min-w-[200px]">
        <Handle type="target" position="top" />
        <Handle type="source" position="bottom" />
      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
            placeholder="标题"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
            placeholder="描述"
            rows="2"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              保存
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="font-semibold text-gray-800 mb-1">{data.title}</div>
          {data.description && (
            <div className="text-sm text-gray-600 mb-3">{data.description}</div>
          )}
          <div className="text-xs text-gray-500 mb-3">ID: {data.id}</div>
          <div className="text-xs text-gray-500 mb-3">层级: {data.level}</div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              编辑
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              +
            </button>
            {data.level > 0 && (
              <button
                onClick={handleDelete}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                -
              </button>
            )}
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="mt-3 p-3 bg-gray-50 rounded border">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
            placeholder="子标签标题"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
            placeholder="子标签描述"
            rows="2"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleAddChild}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              添加
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  industry: IndustryNode,
};

// dagre 布局配置
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// 节点尺寸配置
const nodeWidth = 200;
const nodeHeight = 120;

// 使用 dagre 计算布局
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  // 清除现有节点和边
  dagreGraph.nodes().forEach(n => dagreGraph.removeNode(n));
  dagreGraph.edges().forEach(e => dagreGraph.removeEdge(e));

  // 添加节点
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // 添加边
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 计算布局
  dagre.layout(dagreGraph);

  // 获取布局后的位置
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// 内部组件，使用React Flow hooks
function IndustriesFlow({ industries, setIndustries }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutDirection, setLayoutDirection] = useState('TB'); // TB: 从上到下, LR: 从左到右

  // 创建节点和边
  const createNodesAndEdges = useCallback((flatData) => {
    const newNodes = [];
    const newEdges = [];

    // 创建所有节点
    flatData.forEach((item) => {
      newNodes.push({
        id: item.id,
        type: 'industry',
        position: { x: 0, y: 0 }, // 临时位置，dagre 会重新计算
        data: {
          ...item,
          onUpdate: handleUpdate,
          onDelete: handleDelete,
          onAddChild: handleAddChild,
        },
      });
    });

    // 创建所有边
    flatData.forEach((item) => {
      if (item.parentId) {
        newEdges.push({
          id: `${item.parentId}-${item.id}`,
          source: item.parentId,
          target: item.id,
          type: 'default',
          animated: true,
          style: { stroke: '#2563eb', strokeWidth: 2 },
        });
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }, []);

  // 处理更新
  const handleUpdate = useCallback((updatedIndustry) => {
    setIndustries(prev => 
      prev.map(item => 
        item.id === updatedIndustry.id ? updatedIndustry : item
      )
    );
  }, [setIndustries]);

  // 处理删除
  const handleDelete = useCallback((deletedId) => {
    setIndustries(prev => prev.filter(item => item.id !== deletedId));
  }, [setIndustries]);

  // 处理添加子节点
  const handleAddChild = useCallback((newIndustry) => {
    setIndustries(prev => [...prev, newIndustry]);
  }, [setIndustries]);

  // 更新节点和边
  useEffect(() => {
    if (industries.length > 0) {
      const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(industries);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, layoutDirection);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [industries, createNodesAndEdges, setNodes, setEdges, layoutDirection]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* 布局控制按钮 */}
      <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-lg">
        <div className="flex space-x-2">
          <button
            onClick={() => setLayoutDirection('TB')}
            className={`px-3 py-1 rounded text-sm ${
              layoutDirection === 'TB' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            垂直布局
          </button>
          <button
            onClick={() => setLayoutDirection('LR')}
            className={`px-3 py-1 rounded text-sm ${
              layoutDirection === 'LR' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            水平布局
          </button>
        </div>
      </div>
      
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        edges={edges}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView={false}
        attributionPosition="bottom-left"
        connectOnClick={false}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={false}
      >
        <Controls />
        <Background />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

import MatchLawyerLayout from '../../components/MatchLawyerLayout';

// 主组件
export default function IndustriesPage() {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载数据
  const loadIndustries = useCallback(async () => {
    try {
      const response = await fetch('/api/matchlawyer/industries/list');
      console.log(response);
      if (response.ok) {
        const result = await response.json();
        setIndustries(result.flat);
      } else {
        toast.error('加载数据失败');
      }
    } catch (error) {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化根节点
  const initializeRootNode = useCallback(async () => {
    const rootExists = industries.some(item => item.id === '000000000000');
    if (!rootExists) {
      try {
        const response = await fetch('/api/matchlawyer/industries/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '法学',
            description: '这是根节点，不能编辑',
            parentId: '000000000000'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setIndustries(prev => [...prev, result.data]);
        }
      } catch (error) {
        console.error('初始化根节点失败:', error);
      }
    }
  }, [industries]);

  useEffect(() => {
    loadIndustries();
  }, [loadIndustries]);

  useEffect(() => {
    if (industries.length > 0) {
      initializeRootNode();
    }
  }, [industries, initializeRootNode]);

  if (loading) {
    return (
      <MatchLawyerLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl">加载中...</div>
        </div>
      </MatchLawyerLayout>
    );
  }

  return (
    <MatchLawyerLayout>
      <div className="h-screen w-full flex flex-col">
        <div className="bg-white border-b p-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">行业标签管理</h1>
        </div>
        
        <div className="flex-1 w-full" style={{ height: 'calc(100vh - 80px)' }}>
          <ReactFlowProvider>
            <IndustriesFlow industries={industries} setIndustries={setIndustries} />
          </ReactFlowProvider>
        </div>
      </div>
    </MatchLawyerLayout>
  );
}
