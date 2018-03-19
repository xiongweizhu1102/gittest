//添加退货订单的js
var existEditIndex=-1;
$(function () {
	$('#grid').datagrid({    
		singleSelect:true,  
		showFooter:true,
	    columns:[[    
	        {field:'goodsuuid',title:'商品编号',width:100,editor:{type:'numberbox',options:{
	        	disabled:true}}    
	        },
	        {field:'goodsname',title:'商品名称',width:100,editor:{type:'combobox',options:{
	        	 url:'goods_list.action',    
	        	 valueField:'name',    
	        	 textField:'name',
	        	 onSelect:function(goods){
	        		 var price = goods.inprice;//采购价
	        		 var goodsuuid = goods.uuid;//商品编号
	        		 var goodsuuidEditor = getEditor('goodsuuid');
	        		 $(goodsuuidEditor.target).numberbox('setValue',goodsuuid);
	        		 var priceEditor = getEditor('price');
	        		 $(priceEditor.target).numberbox('setValue',price);
	        		 var numEditor = getEditor('num');
	        		 $(numEditor.target).select();
	        		 //发生了选择价格变化要计算
	        		 cal();
	        		 //合计也要变化
	        		 sum();
	        		 //发生了选择,商品价格发生变化键盘抬起都触发方法
	        		 bindGridEvent();
	        	 }
	        }}   
	        },
	        {field:'price',title:'价格',width:100,editor:{type:'numberbox',options:{
	        	disabled:true,min:0,precision:2,prefix:'¥'}}  
	        },    
	        {field:'num',title:'数量',width:100,editor:'numberbox'},    
	        {field:'money',title:'金额',width:100,editor:{type:'numberbox',options:{
	        	disabled:true,min:0,precision:2,prefix:'¥'}}
	        },   //value为字段值
	        {field:'-',title:'操作',width:100,formatter: function(value,row,index){
				if(row.num=='合计'){
					return;
				}	
	        	return '<a href="javascript:void(0)" onclick="delRow('+index+')">删除</a>';
				}
			},   
	    ]],
	    toolbar: [{
			iconCls: 'icon-add',
			text:'增加',
			handler: function(){
				if(existEditIndex>-1){
					$('#grid').datagrid('endEdit',existEditIndex);
				}
				$('#grid').datagrid("appendRow",{num:0,money:0});
				//最后一行
				 existEditIndex=$("#grid").datagrid('getRows').length-1;
				//最后一行开启编辑
				$('#grid').datagrid('beginEdit',existEditIndex);
				}
	    	},'-',{
			iconCls: 'icon-save',
			text:'提交订单',
			handler: function(){
				if(existEditIndex>-1){
					$('#grid').datagrid('endEdit',existEditIndex);
				}
				//客户下列表提交数据
				var formData=$("#returnOrdersForm").serializeJSON();
				//数据表提交为空
				if(formData['t.supplieruuid']==''){
					$.messager.alert('提示',"请选择客户",'info');
					return;
				}
				//获得所有行的数据
				var rows=$("#grid").datagrid('getRows');
				//将所有字符串转换成字符串提交客户也提交过去了
				formData.json=JSON.stringfy(rows);
				$.ajax({
					url:"orders_add2",
					data:formdata,
					dataType:'json',
					success:function(rtn){
						$.messager.alert('提示',rtn.message,'info',function(){
							if(rtn.success){
								//清空客户
								$("#supplier").combogrid('clear');
								//刷新表格和行脚
								$("#grid").datagrid('loadData',{total:0,rows:[],footer:[{num:'合计',money:0 }]})
							}
						});
					}
				})
			
			}
		}],
		onClickRow:function(rowIndex,RowData){
			if(existEditIndex>-1){
				$('#grid').datagrid('endEdit',existEditIndex);
			}
			//将行索引赋值给当前行
			 existEditIndex=rowIndex;
			//点击的行开启编辑
			$('#grid').datagrid('beginEdit',existEditIndex);
			//开启编辑了,数量发生变化,金额要计算
			cal();
			 //合计也要变化
			sum();
			//编辑数量发生变化也要触发
			bindGridEvent();
		}

	});  
	//加载行脚
	$("#grid").datagrid('reloadFooter',[{num:'合计',money:0}])
	//客户下拉表格
	$('#supplier').combogrid({    
	    panelWidth:750,//宽度
	    idField:'uuid',//提交的内容,combobox.valueField 属性值   
	    textField:'name',//显示的名称
	    mode:'remote',//用户输入将会发送到名为'q'的http请求参数，向服务器检索新的数据。
	    url:'supplier_list.action?t1.type=2' ,//从服务器获取数据 , t1.type=只查询客户的信息
	    columns:[[    
			{field:'uuid',title:'编号',width:100},
			{field:'name',title:'名称',width:100},
			{field:'address',title:'联系地址',width:100},
			{field:'contact',title:'联系人',width:100},
			{field:'tele',title:'联系电话',width:100},
			{field:'email',title:'邮件地址',width:100}   
	    ]]
	});

});
function getEditor(_field){//注意要返回
	return $('#grid').datagrid('getEditor',{index:existEditIndex,field:_field});
}
//计算商品金额
function cal(){
	//数量编辑器
	var numEditor=getEditor('num');
	//取得数量编辑器里面的值
	var num=$(numEditor.target).val();
	//获取商品价格编辑器
	var priceEditor=getEditor('price');
	//得到商品金额
	var price=$(priceEditor.target).numberbox('getValue');
	//金额
	var money=(num*price).toFixed(2);
	//获取金额编辑器
	var moneyEditor=getEditor('money');
	//设置商品金额值
	$(moneyEditor.target).numberbox('setValue',money);
	//获得所有的行,讲行记录的money属性赋值,商品金额赋值给它
	var rows=$('#grid').datagrid('getRows');
	//属性被赋值
	rows[existEditIndex].money=money;
}
function sum(){
	//获得所有的行,取出每行money,累加
	var rows=$('#grid').datagrid('getRows');
	var totalMoney=0;
	$.each(rows,function(index,row){
		totalMoney+=row.money*1;
	});
	totalMoney=totalMoney.toFixed(2);
	//行脚重新加载数据
	$("#grid").datagrid('reloadFooter',[{num:'合计',money:totalMoney}])
}
function bindGridEvent(){
	//获取商品价格编辑器
	var priceEditor=getEditor('price');
	//价格编辑器绑定键盘抬起事件
	$(priceEditor.target).bind('keyup',function(){
		cal();
		//价格变化,金额变化,合计也要变
		sum();
	});
	//获取数量编辑器
	var numEditor=getEditor('num');
	//价格编辑器绑定键盘抬起事件
	$(numEditor.target).bind('keyup',function(){
		cal();
		//价格变化,金额变化,合计也要变
		sum();
	})
}
function delRow(rowIndex){
	//删除行先关闭编辑状态
	$("#grid").datagrid('endEdit',existEditIndex);
	//删除行
	$("#grid").datagrid('deleteRow',rowIndex);
	//重新加载数据
	//先获得数据
	var data=$("#grid").datagrid('getData');
	$("#grid").datagrid('loadData',data);	
}