import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'react-hot-toast';
import MatchLawyerLayout from '../../../components/MatchLawyerLayout';
import dagre from 'dagre';

// 自定义节点组件
const MenuNode = ({ data, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editPath, setEditPath] = useState(data.path);
  const [editIndex, setEditIndex] = useState(data.index);
  const [editIcon, setEditIcon] = useState(data.icon || '');
  const [editRoleIds, setEditRoleIds] = useState(data.roleIds || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newIndex, setNewIndex] = useState(0);
  const [newIcon, setNewIcon] = useState('');
  const [newRoleIds, setNewRoleIds] = useState([]);
  const [roles, setRoles] = useState([]);

  // 加载角色列表
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch('/api/matchlawyer/employeeroles/list');
        if (response.ok) {
          const result = await response.json();
          setRoles(result.data);
        }
      } catch (error) {
        console.error('加载角色列表失败:', error);
      }
    };
    loadRoles();
  }, []);

  const handleEdit = async () => {
    if (!editTitle.trim() || !editPath.trim()) {
      toast.error('标题和路径不能为空');
      return;
    }

    try {
      const response = await fetch('/api/matchlawyer/menusettings/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: data.id,
          title: editTitle,
          path: editPath,
          index: parseInt(editIndex),
          icon: editIcon,
          parentId: data.parentId,
          roleIds: editRoleIds
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
    if (!confirm('确定要删除这个菜单项吗？这将同时删除所有子菜单项。')) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/menusettings/delete?id=${data.id}`, {
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
    if (!newTitle.trim() || !newPath.trim()) {
      toast.error('标题和路径不能为空');
      return;
    }

    try {
      const response = await fetch('/api/matchlawyer/menusettings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          path: newPath,
          index: parseInt(newIndex),
          icon: newIcon,
          parentId: data.id,
          roleIds: newRoleIds
        }),
      });

      if (response.ok) {
        const result = await response.json();
        data.onAddChild(result.data);
        setShowAddForm(false);
        setNewTitle('');
        setNewPath('');
        setNewIndex(0);
        setNewIcon('');
        setNewRoleIds([]);
        toast.success('添加成功');
      } else {
        const error = await response.json();
        toast.error(error.error || '添加失败');
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const handleRoleToggle = (roleId, isEdit = true) => {
    const currentRoleIds = isEdit ? editRoleIds : newRoleIds;
    const setRoleIds = isEdit ? setEditRoleIds : setNewRoleIds;
    
    setRoleIds(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg min-w-[250px]">
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
          <input
            type="text"
            value={editPath}
            onChange={(e) => setEditPath(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
            placeholder="路径"
          />
          <input
            type="number"
            value={editIndex}
            onChange={(e) => setEditIndex(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
            placeholder="顺序"
          />
          <input
            type="text"
            value={editIcon}
            onChange={(e) => setEditIcon(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded"
            placeholder="图标名称（可选）"
          />
          <div className="text-sm font-medium">可访问角色：</div>
          <div className="max-h-20 overflow-y-auto">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={editRoleIds.includes(role.id)}
                  onChange={() => handleRoleToggle(role.id, true)}
                />
                <span>{role.name}</span>
              </label>
            ))}
          </div>
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
          <div className="text-sm text-gray-600 mb-1">路径: {data.path}</div>
          <div className="text-xs text-gray-500 mb-1">层级: {data.level} | 顺序: {data.index}</div>
          {data.icon && (
            <div className="text-xs text-gray-500 mb-1">图标: {data.icon}</div>
          )}
          <div className="text-xs text-gray-500 mb-3">
            角色: {data.roleIds && data.roleIds.length > 0 
              ? roles.filter(r => data.roleIds.includes(r.id)).map(r => r.name).join(', ')
              : '无'
            }
          </div>
          
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
            <button
              onClick={handleDelete}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs"
            >
              -
            </button>
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
            placeholder="子菜单标题"
          />
          <input
            type="text"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
            placeholder="子菜单路径"
          />
          <input
            type="number"
            value={newIndex}
            onChange={(e) => setNewIndex(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
            placeholder="顺序"
          />
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
            placeholder="图标名称（可选）"
          />
          <div className="text-sm font-medium mb-1">可访问角色：</div>
          <div className="max-h-16 overflow-y-auto mb-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={newRoleIds.includes(role.id)}
                  onChange={() => handleRoleToggle(role.id, false)}
                />
                <span>{role.name}</span>
              </label>
            ))}
          </div>
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

// dagre 布局配置
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// 节点尺寸配置
const nodeWidth = 250;
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
function MenuSettingFlow({ menuSettings, setMenuSettings }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutDirection, setLayoutDirection] = useState('TB'); // TB: 从上到下, LR: 从左到右

  // 使用 useMemo 来定义 nodeTypes，避免重新创建
  const nodeTypes = useMemo(() => ({
    menu: MenuNode,
  }), []);

  // 创建节点和边
  const createNodesAndEdges = useCallback((flatData) => {
    const newNodes = [];
    const newEdges = [];

    // 创建所有节点
    flatData.forEach((item) => {
      newNodes.push({
        id: item.id,
        type: 'menu',
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
  const handleUpdate = useCallback((updatedMenuSetting) => {
    setMenuSettings(prev => 
      prev.map(item => 
        item.id === updatedMenuSetting.id ? updatedMenuSetting : item
      )
    );
  }, [setMenuSettings]);

  // 处理删除
  const handleDelete = useCallback((deletedId) => {
    setMenuSettings(prev => prev.filter(item => item.id !== deletedId));
  }, [setMenuSettings]);

  // 处理添加子节点
  const handleAddChild = useCallback((newMenuSetting) => {
    setMenuSettings(prev => [...prev, newMenuSetting]);
  }, [setMenuSettings]);

  // 更新节点和边
  useEffect(() => {
    if (menuSettings.length > 0) {
      const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(menuSettings);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, layoutDirection);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [menuSettings, createNodesAndEdges, setNodes, setEdges, layoutDirection]);

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

// 主组件
export default function MenuSettingPage() {
  const [menuSettings, setMenuSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载数据
  const loadMenuSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/matchlawyer/menusettings/list');
      if (response.ok) {
        const result = await response.json();
        setMenuSettings(result.data);
      } else {
        toast.error('加载数据失败');
      }
    } catch (error) {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuSettings();
  }, [loadMenuSettings]);

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
          <h1 className="text-2xl font-bold text-gray-800">权限设定</h1>
          <p className="text-gray-600 mt-2">建立网站拓扑，动态构造导航栏</p>
        </div>
        
        <div className="flex-1 w-full" style={{ height: 'calc(100vh - 120px)' }}>
          <ReactFlowProvider>
            <MenuSettingFlow menuSettings={menuSettings} setMenuSettings={setMenuSettings} />
          </ReactFlowProvider>
        </div>
      </div>
    </MatchLawyerLayout>
  );
} 