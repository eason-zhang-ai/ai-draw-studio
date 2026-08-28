export interface CachedResponse {
    promptText: string;
    hasImage: boolean;
    xml: string;
}

export const CACHED_EXAMPLE_RESPONSES: CachedResponse[] = [
    {
        promptText: "Show me examples of beautiful and dynamic connectors",
        hasImage: false,
        xml: `<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>

  <!-- Title -->
  <mxCell id="title" value="高级连接器示例" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=24;fontStyle=1;fontColor=#2C3E50;" vertex="1" parent="1">
    <mxGeometry x="250" y="20" width="300" height="40" as="geometry"/>
  </mxCell>

  <!-- Nodes with modern styling -->
  <mxCell id="node1" value="数据源" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#3498DB;strokeColor=#2980B9;gradientColor=#5DADE2;gradientDirection=west;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="100" y="100" width="100" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="node2" value="处理器" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2ECC71;strokeColor=#27AE60;gradientColor=#58D68D;gradientDirection=west;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="300" y="100" width="100" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="node3" value="存储层" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F39C12;strokeColor=#D68910;gradientColor=#F7DC6F;gradientDirection=west;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="500" y="100" width="100" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="node4" value="API网关" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#9B59B6;strokeColor=#8E44AD;gradientColor=#BB8FCE;gradientDirection=west;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="100" y="250" width="100" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="node5" value="业务逻辑" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E74C3C;strokeColor=#CB4335;gradientColor=#F1948A;gradientDirection=west;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="300" y="250" width="100" height="50" as="geometry"/>
  </mxCell>

  <mxCell id="node6" value="用户界面" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1ABC9C;strokeColor=#16A085;gradientColor=#76D7C4;gradientDirection=west;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="500" y="250" width="100" height="50" as="geometry"/>
  </mxCell>

  <!-- Modern connectors with gradients and animations -->
  <mxCell id="conn1" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;strokeWidth=3;strokeColor=#3498DB;fillColor=#3498DB;gradientColor=#5DADE2;flowAnimation=1;" edge="1" parent="1" source="node1" target="node2">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn2" value="数据流" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;strokeWidth=4;strokeColor=#2ECC71;fillColor=#2ECC71;gradientColor=#58D68D;flowAnimation=1;edgeLabel;fontSize=10;fontColor=#FFFFFF;" edge="1" parent="1" source="node2" target="node3">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn3" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;strokeWidth=3;strokeColor=#9B59B6;fillColor=#9B59B6;gradientColor=#BB8FCE;flowAnimation=1;curved=1;" edge="1" parent="1" source="node1" target="node4">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn4" value="异步" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=diamond;strokeWidth=3;strokeColor=#F39C12;fillColor=#F39C12;gradientColor=#F7DC6F;flowAnimation=1;dashed=1;edgeLabel;fontSize=10;fontColor=#F39C12;" edge="1" parent="1" source="node3" target="node6">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn5" value="双向" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;startArrow=classic;strokeWidth=4;strokeColor=#E74C3C;fillColor=#E74C3C;gradientColor=#F1948A;flowAnimation=1;edgeLabel;fontSize=10;fontColor=#E74C3C;" edge="1" parent="1" source="node4" target="node5">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn6" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;strokeWidth=5;strokeColor=#1ABC9C;fillColor=#1ABC9C;gradientColor=#76D7C4;flowAnimation=1;" edge="1" parent="1" source="node5" target="node6">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn7" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;strokeWidth=3;strokeColor=#3498DB;fillColor=#3498DB;gradientColor=#5DADE2;flowAnimation=1;" edge="1" parent="1" source="node2" target="node5">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn8" value="" style="edgeStyle=elbowEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;strokeWidth=4;strokeColor=#F39C12;fillColor=#F39C12;gradientColor=#F7DC6F;flowAnimation=1;elbow=horizontal;" edge="1" parent="1" source="node1" target="node5">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <!-- Background grid for better visual -->
  <mxCell id="grid" value="" style="shape=partialRectangle;whiteSpace=wrap;html=1;fillColor=#F8F9FA;strokeColor=#E9ECEF;strokeWidth=1;dashed=1;" vertex="1" parent="1">
    <mxGeometry x="50" y="50" width="600" height="300" as="geometry"/>
  </mxCell>
</root>`,
    },
    {
        promptText: "Give me a **animated connector** diagram of transformer's architecture",
        hasImage: false,
        xml: `<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>

  <!-- Title -->
  <mxCell id="title" value="Transformer架构图" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=24;fontStyle=1;fontColor=#2C3E50;" vertex="1" parent="1">
    <mxGeometry x="300" y="20" width="300" height="40" as="geometry"/>
  </mxCell>

  <!-- Background Container -->
  <mxCell id="bg" value="" style="shape=partialRectangle;whiteSpace=wrap;html=1;fillColor=#F8F9FA;strokeColor=#E9ECEF;strokeWidth=1;dashed=1;" vertex="1" parent="1">
    <mxGeometry x="50" y="50" width="800" height="500" as="geometry"/>
  </mxCell>

  <!-- Input Embedding (Left - Encoder Side) -->
  <mxCell id="input_embed" value="输入嵌入" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#3498DB;strokeColor=#2980B9;gradientColor=#5DADE2;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="80" y="480" width="140" height="50" as="geometry"/>
  </mxCell>

  <!-- Positional Encoding (Left) -->
  <mxCell id="pos_enc_left" value="位置编码" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2ECC71;strokeColor=#27AE60;gradientColor=#58D68D;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="80" y="400" width="140" height="50" as="geometry"/>
  </mxCell>

  <!-- Encoder Stack -->
  <mxCell id="encoder_box" value="编码器" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#9B59B6;strokeColor=#8E44AD;gradientColor=#BB8FCE;fontColor=#FFFFFF;fontSize=14;fontStyle=1;shadow=1;verticalAlign=top;" vertex="1" parent="1">
    <mxGeometry x="60" y="150" width="180" height="230" as="geometry"/>
  </mxCell>

  <!-- Multi-Head Attention (Encoder) -->
  <mxCell id="mha_enc" value="多头注意力&#xa;机制" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F39C12;strokeColor=#D68910;gradientColor=#F7DC6F;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="80" y="300" width="140" height="60" as="geometry"/>
  </mxCell>

  <!-- Add & Norm 1 (Encoder) -->
  <mxCell id="add_norm1_enc" value="加法和&#xa;归一化" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1ABC9C;strokeColor=#16A085;gradientColor=#76D7C4;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="80" y="240" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Feed Forward (Encoder) -->
  <mxCell id="ff_enc" value="前馈网络" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E74C3C;strokeColor=#CB4335;gradientColor=#F1948A;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="80" y="190" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Add & Norm 2 (Encoder) -->
  <mxCell id="add_norm2_enc" value="加法和&#xa;归一化" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1ABC9C;strokeColor=#16A085;gradientColor=#76D7C4;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="80" y="150" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Nx label for encoder -->
  <mxCell id="nx_enc" value="Nx" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=2;fontColor=#9B59B6;" vertex="1" parent="1">
    <mxGeometry x="30" y="255" width="40" height="40" as="geometry"/>
  </mxCell>

  <!-- Output Embedding (Right - Decoder Side) -->
  <mxCell id="output_embed" value="输出嵌入" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#3498DB;strokeColor=#2980B9;gradientColor=#5DADE2;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="480" width="140" height="50" as="geometry"/>
  </mxCell>

  <!-- Positional Encoding (Right) -->
  <mxCell id="pos_enc_right" value="位置编码" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2ECC71;strokeColor=#27AE60;gradientColor=#58D68D;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="400" width="140" height="50" as="geometry"/>
  </mxCell>

  <!-- Decoder Stack -->
  <mxCell id="decoder_box" value="解码器" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F39C12;strokeColor=#D68910;gradientColor=#F7DC6F;fontColor=#FFFFFF;fontSize=14;fontStyle=1;shadow=1;verticalAlign=top;" vertex="1" parent="1">
    <mxGeometry x="630" y="120" width="180" height="280" as="geometry"/>
  </mxCell>

  <!-- Masked Multi-Head Attention (Decoder) -->
  <mxCell id="masked_mha_dec" value="掩码多头&#xa;注意力" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F39C12;strokeColor=#D68910;gradientColor=#F7DC6F;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="330" width="140" height="60" as="geometry"/>
  </mxCell>

  <!-- Add & Norm 1 (Decoder) -->
  <mxCell id="add_norm1_dec" value="加法和&#xa;归一化" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1ABC9C;strokeColor=#16A085;gradientColor=#76D7C4;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="270" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Multi-Head Attention (Decoder - Cross Attention) -->
  <mxCell id="mha_dec" value="多头注意力&#xa;（交叉）" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F39C12;strokeColor=#D68910;gradientColor=#F7DC6F;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="220" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Add & Norm 2 (Decoder) -->
  <mxCell id="add_norm2_dec" value="加法和&#xa;归一化" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1ABC9C;strokeColor=#16A085;gradientColor=#76D7C4;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="180" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Feed Forward (Decoder) -->
  <mxCell id="ff_dec" value="前馈网络" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E74C3C;strokeColor=#CB4335;gradientColor=#F1948A;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="140" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Add & Norm 3 (Decoder) -->
  <mxCell id="add_norm3_dec" value="加法和&#xa;归一化" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1ABC9C;strokeColor=#16A085;gradientColor=#76D7C4;fontColor=#FFFFFF;fontSize=11;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="100" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Nx label for decoder -->
  <mxCell id="nx_dec" value="Nx" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=2;fontColor=#F39C12;" vertex="1" parent="1">
    <mxGeometry x="790" y="255" width="40" height="40" as="geometry"/>
  </mxCell>

  <!-- Linear -->
  <mxCell id="linear" value="线性层" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#9B59B6;strokeColor=#8E44AD;gradientColor=#BB8FCE;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="60" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Softmax -->
  <mxCell id="softmax" value="Softmax" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2ECC71;strokeColor=#27AE60;gradientColor=#58D68D;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="650" y="10" width="140" height="40" as="geometry"/>
  </mxCell>

  <!-- Output Probabilities -->
  <mxCell id="output" value="输出概率" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#3498DB;strokeColor=#2980B9;gradientColor=#5DADE2;fontColor=#FFFFFF;fontSize=12;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="640" y="-40" width="160" height="40" as="geometry"/>
  </mxCell>

  <!-- Modern Animated Connectors with Labels -->
  <mxCell id="conn1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#3498DB;fillColor=#3498DB;gradientColor=#5DADE2;flowAnimation=1;" edge="1" parent="1" source="input_embed" target="pos_enc_left">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#2ECC71;fillColor=#2ECC71;gradientColor=#58D68D;flowAnimation=1;" edge="1" parent="1" source="pos_enc_left" target="mha_enc">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn3" value="前向传播" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#F39C12;fillColor=#F39C12;gradientColor=#F7DC6F;flowAnimation=1;edgeLabel;fontSize=10;fontColor=#F39C12;" edge="1" parent="1" source="mha_enc" target="add_norm1_enc">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#1ABC9C;fillColor=#1ABC9C;gradientColor=#76D7C4;flowAnimation=1;" edge="1" parent="1" source="add_norm1_enc" target="ff_enc">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn5" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#E74C3C;fillColor=#E74C3C;gradientColor=#F1948A;flowAnimation=1;" edge="1" parent="1" source="ff_enc" target="add_norm2_enc">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <!-- Encoder to Decoder Cross Attention -->
  <mxCell id="conn_cross" value="K, V" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeWidth=4;strokeColor=#9B59B6;fillColor=#9B59B6;gradientColor=#BB8FCE;flowAnimation=1;dashed=1;edgeLabel;fontSize=10;fontColor=#FFFFFF;" edge="1" parent="1" source="add_norm2_enc" target="mha_dec">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <!-- Animated Connectors - Decoder Side -->
  <mxCell id="conn6" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#3498DB;fillColor=#3498DB;gradientColor=#5DADE2;flowAnimation=1;" edge="1" parent="1" source="output_embed" target="pos_enc_right">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn7" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#2ECC71;fillColor=#2ECC71;gradientColor=#58D68D;flowAnimation=1;" edge="1" parent="1" source="pos_enc_right" target="masked_mha_dec">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn8" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#1ABC9C;fillColor=#1ABC9C;gradientColor=#76D7C4;flowAnimation=1;" edge="1" parent="1" source="masked_mha_dec" target="add_norm1_dec">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn9" value="交叉注意力" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#F39C12;fillColor=#F39C12;gradientColor=#F7DC6F;flowAnimation=1;edgeLabel;fontSize=10;fontColor=#F39C12;" edge="1" parent="1" source="add_norm1_dec" target="mha_dec">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn10" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#1ABC9C;fillColor=#1ABC9C;gradientColor=#76D7C4;flowAnimation=1;" edge="1" parent="1" source="mha_dec" target="add_norm2_dec">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn11" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#E74C3C;fillColor=#E74C3C;gradientColor=#F1948A;flowAnimation=1;" edge="1" parent="1" source="add_norm2_dec" target="ff_dec">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn12" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#1ABC9C;fillColor=#1ABC9C;gradientColor=#76D7C4;flowAnimation=1;" edge="1" parent="1" source="ff_dec" target="add_norm3_dec">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn13" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#9B59B6;fillColor=#9B59B6;gradientColor=#BB8FCE;flowAnimation=1;" edge="1" parent="1" source="add_norm3_dec" target="linear">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn14" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=3;strokeColor=#2ECC71;fillColor=#2ECC71;gradientColor=#58D68D;flowAnimation=1;" edge="1" parent="1" source="linear" target="softmax">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="conn15" value="输出概率" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;strokeWidth=4;strokeColor=#3498DB;fillColor=#3498DB;gradientColor=#5DADE2;flowAnimation=1;edgeLabel;fontSize=10;fontColor=#FFFFFF;" edge="1" parent="1" source="softmax" target="output">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <!-- Input/Output Labels -->
  <mxCell id="input_label" value="输入序列" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;fontColor=#3498DB;" vertex="1" parent="1">
    <mxGeometry x="110" y="540" width="80" height="30" as="geometry"/>
  </mxCell>

  <mxCell id="output_label" value="输出序列" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;fontColor=#3498DB;" vertex="1" parent="1">
    <mxGeometry x="660" y="540" width="80" height="30" as="geometry"/>
  </mxCell>
</root>`,
    },
    {
        promptText: "Replicate this in aws style",
        hasImage: true,
        xml: `<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>

  <!-- AWS Cloud Container -->
  <mxCell id="2" value="AWS" style="sketch=0;outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;rounded=1;arcSize=5;" vertex="1" parent="1">
    <mxGeometry x="340" y="40" width="880" height="520" as="geometry"/>
  </mxCell>

  <!-- User -->
  <mxCell id="3" value="User" style="sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#232F3D;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=14;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.user;rounded=1;" vertex="1" parent="1">
    <mxGeometry x="80" y="240" width="78" height="78" as="geometry"/>
  </mxCell>

  <!-- EC2 Instance -->
  <mxCell id="4" value="EC2" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;fillColor=#ED7100;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=14;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2;rounded=1;" vertex="1" parent="1">
    <mxGeometry x="560" y="240" width="78" height="78" as="geometry"/>
  </mxCell>

  <!-- S3 Bucket -->
  <mxCell id="5" value="S3" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;fillColor=#7AA116;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=14;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.s3;rounded=1;" vertex="1" parent="1">
    <mxGeometry x="960" y="120" width="78" height="78" as="geometry"/>
  </mxCell>

  <!-- Bedrock -->
  <mxCell id="6" value="bedrock" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;fillColor=#01A88D;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=14;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.bedrock;rounded=1;" vertex="1" parent="1">
    <mxGeometry x="960" y="260" width="78" height="78" as="geometry"/>
  </mxCell>

  <!-- DynamoDB -->
  <mxCell id="7" value="DynamoDB" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;fillColor=#C925D1;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=14;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.dynamodb;rounded=1;" vertex="1" parent="1">
    <mxGeometry x="960" y="400" width="78" height="78" as="geometry"/>
  </mxCell>

  <!-- Arrow: User to EC2 -->
  <mxCell id="8" value="" style="endArrow=classic;html=1;rounded=0;strokeColor=#232F3E;strokeWidth=2;exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=0;" edge="1" parent="1" source="3" target="4">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="400" y="350" as="sourcePoint"/>
      <mxPoint x="450" y="300" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Arrow: EC2 to S3 -->
  <mxCell id="9" value="" style="endArrow=classic;html=1;rounded=0;strokeColor=#232F3E;strokeWidth=2;exitX=1;exitY=0.25;exitDx=0;exitDy=0;exitPerimeter=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=0;" edge="1" parent="1" source="4" target="5">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="700" y="350" as="sourcePoint"/>
      <mxPoint x="750" y="300" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Arrow: EC2 to Bedrock -->
  <mxCell id="10" value="" style="endArrow=classic;html=1;rounded=0;strokeColor=#232F3E;strokeWidth=2;exitX=1;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=0;" edge="1" parent="1" source="4" target="6">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="700" y="350" as="sourcePoint"/>
      <mxPoint x="750" y="300" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Arrow: EC2 to DynamoDB -->
  <mxCell id="11" value="" style="endArrow=classic;html=1;rounded=0;strokeColor=#232F3E;strokeWidth=2;exitX=1;exitY=0.75;exitDx=0;exitDy=0;exitPerimeter=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;entryPerimeter=0;" edge="1" parent="1" source="4" target="7">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="700" y="350" as="sourcePoint"/>
      <mxPoint x="750" y="300" as="targetPoint"/>
    </mxGeometry>
  </mxCell>
</root>`,
    },
    {
        promptText: "Replicate this flowchart.",
        hasImage: true,
        xml: `<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>

  <!-- Background -->
  <mxCell id="bg" value="" style="shape=partialRectangle;whiteSpace=wrap;html=1;fillColor=#F8F9FA;strokeColor=#E9ECEF;strokeWidth=1;dashed=1;" vertex="1" parent="1">
    <mxGeometry x="50" y="30" width="600" height="700" as="geometry"/>
  </mxCell>

  <!-- Start: Lamp doesn't work -->
  <mxCell id="2" value="台灯不工作" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E74C3C;strokeColor=#CB4335;gradientColor=#F1948A;fontColor=#FFFFFF;fontSize=18;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="140" y="50" width="200" height="70" as="geometry"/>
  </mxCell>

  <!-- Arrow from start to first decision -->
  <mxCell id="3" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#3498DB;strokeWidth=3;endArrow=block;endFill=1;flowAnimation=1;" edge="1" parent="1" source="2" target="4">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <!-- Decision: Lamp plugged in? -->
  <mxCell id="4" value="台灯是否&#xa;插入电源？" style="rhombus;whiteSpace=wrap;html=1;fillColor=#F39C12;strokeColor=#D68910;gradientColor=#F7DC6F;fontColor=#FFFFFF;fontSize=16;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="130" y="170" width="220" height="120" as="geometry"/>
  </mxCell>

  <!-- Arrow to Plug in lamp (No) -->
  <mxCell id="5" value="否" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#E74C3C;strokeWidth=3;endArrow=block;endFill=1;fontSize=14;flowAnimation=1;edgeLabel;fontColor=#E74C3C;" edge="1" parent="1" source="4" target="6">
    <mxGeometry x="-0.2" relative="1" as="geometry">
      <mxPoint as="offset"/>
    </mxGeometry>
  </mxCell>

  <!-- Action: Plug in lamp -->
  <mxCell id="6" value="插入台灯" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2ECC71;strokeColor=#27AE60;gradientColor=#58D68D;fontColor=#FFFFFF;fontSize=16;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="420" y="220" width="200" height="60" as="geometry"/>
  </mxCell>

  <!-- Arrow down to second decision (Yes) -->
  <mxCell id="7" value="是" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#2ECC71;strokeWidth=3;endArrow=block;endFill=1;fontSize=14;flowAnimation=1;edgeLabel;fontColor=#2ECC71;" edge="1" parent="1" source="4" target="8">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <!-- Decision: Bulb burned out? -->
  <mxCell id="8" value="灯泡是否&#xa;烧坏了？" style="rhombus;whiteSpace=wrap;html=1;fillColor=#F39C12;strokeColor=#D68910;gradientColor=#F7DC6F;fontColor=#FFFFFF;fontSize=16;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="130" y="350" width="220" height="120" as="geometry"/>
  </mxCell>

  <!-- Arrow to Replace bulb (Yes) -->
  <mxCell id="9" value="是" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#E74C3C;strokeWidth=3;endArrow=block;endFill=1;fontSize=14;flowAnimation=1;edgeLabel;fontColor=#E74C3C;" edge="1" parent="1" source="8" target="10">
    <mxGeometry x="-0.2" relative="1" as="geometry">
      <mxPoint as="offset"/>
    </mxGeometry>
  </mxCell>

  <!-- Action: Replace bulb -->
  <mxCell id="10" value="更换灯泡" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2ECC71;strokeColor=#27AE60;gradientColor=#58D68D;fontColor=#FFFFFF;fontSize=16;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="420" y="400" width="200" height="60" as="geometry"/>
  </mxCell>

  <!-- Arrow down to Repair lamp (No) -->
  <mxCell id="11" value="否" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#3498DB;strokeWidth=3;endArrow=block;endFill=1;fontSize=14;flowAnimation=1;edgeLabel;fontColor=#3498DB;" edge="1" parent="1" source="8" target="12">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <!-- Action: Repair lamp -->
  <mxCell id="12" value="维修台灯" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#9B59B6;strokeColor=#8E44AD;gradientColor=#BB8FCE;fontColor=#FFFFFF;fontSize=16;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="130" y="550" width="200" height="60" as="geometry"/>
  </mxCell>

  <!-- End -->
  <mxCell id="13" value="问题解决" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1ABC9C;strokeColor=#16A085;gradientColor=#76D7C4;fontColor=#FFFFFF;fontSize=16;fontStyle=1;shadow=1;" vertex="1" parent="1">
    <mxGeometry x="140" y="650" width="180" height="60" as="geometry"/>
  </mxCell>

  <!-- Final arrows -->
  <mxCell id="14" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1ABC9C;strokeWidth=3;endArrow=block;endFill=1;flowAnimation=1;" edge="1" parent="1" source="6" target="13">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="15" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1ABC9C;strokeWidth=3;endArrow=block;endFill=1;flowAnimation=1;" edge="1" parent="1" source="10" target="13">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <mxCell id="16" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#1ABC9C;strokeWidth=3;endArrow=block;endFill=1;flowAnimation=1;" edge="1" parent="1" source="12" target="13">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>

  <!-- Title -->
  <mxCell id="title" value="台灯故障排除流程图" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=20;fontStyle=1;fontColor=#2C3E50;" vertex="1" parent="1">
    <mxGeometry x="200" y="10" width="200" height="30" as="geometry"/>
  </mxCell>
</root>`,
    },
    {
        promptText: "Draw a cat for me",
        hasImage: false,
        xml: `<root>
  <mxCell id="0"/>
  <mxCell id="1" parent="0"/>

  <!-- Cat's head -->
  <mxCell id="2" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">
    <mxGeometry x="300" y="150" width="120" height="120" as="geometry"/>
  </mxCell>

  <!-- Left ear -->
  <mxCell id="3" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;rotation=30;" vertex="1" parent="1">
    <mxGeometry x="280" y="120" width="50" height="60" as="geometry"/>
  </mxCell>

  <!-- Right ear -->
  <mxCell id="4" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;rotation=-30;" vertex="1" parent="1">
    <mxGeometry x="390" y="120" width="50" height="60" as="geometry"/>
  </mxCell>

  <!-- Left ear inner -->
  <mxCell id="5" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFB6C1;strokeColor=none;rotation=30;" vertex="1" parent="1">
    <mxGeometry x="290" y="135" width="30" height="35" as="geometry"/>
  </mxCell>

  <!-- Right ear inner -->
  <mxCell id="6" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFB6C1;strokeColor=none;rotation=-30;" vertex="1" parent="1">
    <mxGeometry x="400" y="135" width="30" height="35" as="geometry"/>
  </mxCell>

  <!-- Left eye -->
  <mxCell id="7" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
    <mxGeometry x="325" y="185" width="15" height="15" as="geometry"/>
  </mxCell>

  <!-- Right eye -->
  <mxCell id="8" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
    <mxGeometry x="380" y="185" width="15" height="15" as="geometry"/>
  </mxCell>

  <!-- Nose -->
  <mxCell id="9" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFB6C1;strokeColor=#000000;strokeWidth=1;rotation=180;" vertex="1" parent="1">
    <mxGeometry x="350" y="210" width="20" height="15" as="geometry"/>
  </mxCell>

  <!-- Mouth left -->
  <mxCell id="10" value="" style="curved=1;endArrow=none;html=1;strokeColor=#000000;strokeWidth=2;exitX=0.5;exitY=1;exitDx=0;exitDy=0;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="360" y="220" as="sourcePoint"/>
      <mxPoint x="340" y="235" as="targetPoint"/>
      <Array as="points">
        <mxPoint x="355" y="230"/>
      </Array>
    </mxGeometry>
  </mxCell>

  <!-- Mouth right -->
  <mxCell id="11" value="" style="curved=1;endArrow=none;html=1;strokeColor=#000000;strokeWidth=2;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="360" y="220" as="sourcePoint"/>
      <mxPoint x="380" y="235" as="targetPoint"/>
      <Array as="points">
        <mxPoint x="365" y="230"/>
      </Array>
    </mxGeometry>
  </mxCell>

  <!-- Left whisker 1 -->
  <mxCell id="12" value="" style="endArrow=none;html=1;strokeColor=#000000;strokeWidth=1.5;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="310" y="200" as="sourcePoint"/>
      <mxPoint x="260" y="195" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Left whisker 2 -->
  <mxCell id="13" value="" style="endArrow=none;html=1;strokeColor=#000000;strokeWidth=1.5;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="310" y="210" as="sourcePoint"/>
      <mxPoint x="260" y="210" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Left whisker 3 -->
  <mxCell id="14" value="" style="endArrow=none;html=1;strokeColor=#000000;strokeWidth=1.5;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="310" y="220" as="sourcePoint"/>
      <mxPoint x="260" y="225" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Right whisker 1 -->
  <mxCell id="15" value="" style="endArrow=none;html=1;strokeColor=#000000;strokeWidth=1.5;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="410" y="200" as="sourcePoint"/>
      <mxPoint x="460" y="195" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Right whisker 2 -->
  <mxCell id="16" value="" style="endArrow=none;html=1;strokeColor=#000000;strokeWidth=1.5;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="410" y="210" as="sourcePoint"/>
      <mxPoint x="460" y="210" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Right whisker 3 -->
  <mxCell id="17" value="" style="endArrow=none;html=1;strokeColor=#000000;strokeWidth=1.5;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="410" y="220" as="sourcePoint"/>
      <mxPoint x="460" y="225" as="targetPoint"/>
    </mxGeometry>
  </mxCell>

  <!-- Body -->
  <mxCell id="18" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">
    <mxGeometry x="285" y="250" width="150" height="180" as="geometry"/>
  </mxCell>

  <!-- Belly -->
  <mxCell id="19" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=none;" vertex="1" parent="1">
    <mxGeometry x="315" y="280" width="90" height="120" as="geometry"/>
  </mxCell>

  <!-- Left front paw -->
  <mxCell id="20" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">
    <mxGeometry x="300" y="410" width="40" height="50" as="geometry"/>
  </mxCell>

  <!-- Right front paw -->
  <mxCell id="21" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">
    <mxGeometry x="380" y="410" width="40" height="50" as="geometry"/>
  </mxCell>

  <!-- Tail -->
  <mxCell id="22" value="" style="curved=1;endArrow=none;html=1;strokeColor=#000000;strokeWidth=3;fillColor=#FFE6CC;" edge="1" parent="1">
    <mxGeometry width="50" height="50" relative="1" as="geometry">
      <mxPoint x="285" y="340" as="sourcePoint"/>
      <mxPoint x="240" y="260" as="targetPoint"/>
      <Array as="points">
        <mxPoint x="260" y="350"/>
        <mxPoint x="240" y="320"/>
        <mxPoint x="235" y="290"/>
      </Array>
    </mxGeometry>
  </mxCell>

</root>`,
    },
];

export function findCachedResponse(
    promptText: string,
    hasImage: boolean
): CachedResponse | undefined {
    return CACHED_EXAMPLE_RESPONSES.find(
        (c) => c.promptText === promptText && c.hasImage === hasImage && c.xml !== ''
    );
}