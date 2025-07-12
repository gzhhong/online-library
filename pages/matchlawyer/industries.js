import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'react-hot-toast';

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

// 内部组件，使用React Flow hooks
function IndustriesFlow({ industries, setIndustries }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // 创建节点和边
  const createNodesAndEdges = useCallback((treeData, parentId = null, xOffset = 0) => {
    const newNodes = [];
    const newEdges = [];
    let currentX = xOffset;

    treeData.forEach((item, index) => {
      const nodeId = item.id;
      const yPos = item.level * 150;
      
      newNodes.push({
        id: nodeId,
        type: 'industry',
        position: { x: currentX, y: yPos },
        data: {
          ...item,
          onUpdate: handleUpdate,
          onDelete: handleDelete,
          onAddChild: handleAddChild,
        },
      });

      if (parentId) {
        newEdges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          animated: true,
        });
      }

      if (item.children && item.children.length > 0) {
        const childWidth = 250;
        const childXOffset = currentX - (item.children.length - 1) * childWidth / 2;
        const { nodes: childNodes, edges: childEdges } = createNodesAndEdges(
          item.children,
          nodeId,
          childXOffset
        );
        newNodes.push(...childNodes);
        newEdges.push(...childEdges);
      }

      currentX += 250;
    });

    return { nodes: newNodes, edges: newEdges };
  }, []);

  // 从扁平数据构建树
  const buildTreeFromFlat = (flatData) => {
    const map = {};
    const roots = [];

    flatData.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });

    flatData.forEach(item => {
      if (item.parentId) {
        map[item.parentId]?.children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });

    return roots;
  };

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

  // 处理连接
  const onConnect = useCallback(async (params) => {
    try {
      const response = await fetch('/api/matchlawyer/industries/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params.target,
          title: industries.find(i => i.id === params.target)?.title || '',
          description: industries.find(i => i.id === params.target)?.description || '',
          parentId: params.source
        }),
      });

      if (response.ok) {
        const result = await response.json();
        handleUpdate(result.data);
        setEdges(eds => addEdge(params, eds));
        toast.success('移动成功');
      } else {
        const error = await response.json();
        toast.error(error.error || '移动失败');
      }
    } catch (error) {
      toast.error('移动失败');
    }
  }, [industries, handleUpdate, setEdges]);

  // 更新节点和边
  useEffect(() => {
    if (industries.length > 0) {
      const treeData = buildTreeFromFlat(industries);
      const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(treeData);
      setNodes(newNodes);
      setEdges(newEdges);
      setTimeout(() => fitView(), 100);
    }
  }, [industries, createNodesAndEdges, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-left"
    >
      <Controls />
      <Background />
      <MiniMap />
    </ReactFlow>
  );
}

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
    const rootExists = industries.some(item => item.id === '00000000000');
    if (!rootExists) {
      try {
        const response = await fetch('/api/matchlawyer/industries/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '根标签',
            description: '这是根标签',
            parentId: '00000000000'
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800">标签管理</h1>
        <p className="text-gray-600">拖拽标签可以改变层级关系</p>
      </div>
      
      <div className="h-full">
        <ReactFlowProvider>
          <IndustriesFlow industries={industries} setIndustries={setIndustries} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
