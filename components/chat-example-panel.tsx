export default function ExamplePanel({
    setInput,
    setFiles,
}: {
    setInput: (input: string) => void;
    setFiles: (files: File[]) => void;
}) {
    // New handler for the "Replicate this flowchart" button
    const handleReplicateFlowchart = async () => {
        setInput("复制此流程图");

        try {
            // Fetch the example image
            const response = await fetch("/example.png");
            const blob = await response.blob();
            const file = new File([blob], "example.png", { type: "image/png" });

            // Set the file to the files state
            setFiles([file]);
        } catch (error) {
            console.error("Error loading example image:", error);
        }
    };

    // Handler for the "Replicate this in aws style" button
    const handleReplicateArchitecture = async () => {
        setInput("以AWS风格复制此图");

        try {
            // Fetch the architecture image
            const response = await fetch("/architecture.png");
            const blob = await response.blob();
            const file = new File([blob], "architecture.png", {
                type: "image/png",
            });

            // Set the file to the files state
            setFiles([file]);
        } catch (error) {
            console.error("Error loading architecture image:", error);
        }
    };
    return (
        <div className="px-4 py-2 border-t border-b border-gray-100">
            <p className="text-sm text-gray-500 mb-2">
                {" "}
                开始对话以生成或修改图表，尝试这些示例：
            </p>
            <p className="text-sm text-gray-500 mb-2"></p>
            <div className="flex flex-wrap gap-5">
                <button
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
                    onClick={() =>
                        setInput("帮我设计一个电商高并发微服务架构图，包含网关、缓存、消息队列、数据库和监控")
                    }
                >
                    电商高并发微服务架构图
                </button>
                <button
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
                    onClick={() =>
                        setInput("帮我设计一个订单从下单、支付到履约的业务流程图，包含异常、退款和通知分支")
                    }
                >
                    订单支付履约业务流程图
                </button>
                <button
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
                    onClick={() =>
                        setInput("帮我设计一个实时数据管道架构图，包含数据采集、消息队列、流处理、数仓、质量校验和监控")
                    }
                >
                    实时数据管道架构图
                </button>
                {/*<button
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
                    onClick={handleReplicateArchitecture}
                >
                    以AWS风格创建此图
                </button>
                <button
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
                    onClick={handleReplicateFlowchart}
                >
                    复制此流程图
                </button>*/}
            </div>
        </div>
    );
}
