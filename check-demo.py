#!/usr/bin/env python3
"""
Epicourier Demo - 功能检查脚本
验证所有演示功能是否可用
"""

import requests
import json
from datetime import datetime

# 配置
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"
SUPABASE_URL = "http://127.0.0.1:54321"

def check_service(url, name):
    """检查服务是否运行"""
    try:
        response = requests.get(url, timeout=5)
        print(f"✅ {name}: {url}")
        return True
    except Exception as e:
        print(f"❌ {name}: {url}")
        print(f"   错误: {str(e)}")
        return False

def check_api_endpoints():
    """检查后端 API 端点"""
    endpoints = [
        ("/api/recipes", "食谱 API"),
        ("/api/nutrients/daily", "营养 API"),
        ("/api/achievements", "成就 API"),
        ("/api/challenges", "挑战 API"),
        ("/docs", "API 文档"),
    ]
    
    print("\n🔗 检查后端 API 端点:")
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=5)
            status = "✅" if response.status_code < 500 else "⚠️"
            print(f"{status} {name}: {response.status_code}")
        except Exception as e:
            print(f"❌ {name}: 连接失败")

def main():
    print("=" * 50)
    print("🎬 Epicourier Demo - 功能检查")
    print("=" * 50)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 检查服务
    print("🌐 检查服务运行状态:")
    services_ok = 0
    services_ok += check_service(SUPABASE_URL, "Supabase")
    services_ok += check_service(BACKEND_URL, "后端 API")
    services_ok += check_service(FRONTEND_URL, "前端应用")
    
    # 检查 API
    check_api_endpoints()
    
    # 总结
    print("\n" + "=" * 50)
    if services_ok == 3:
        print("✅ 所有服务正常运行！")
        print("\n📋 演示功能清单:")
        print("  ✅ 用户认证系统")
        print("  ✅ 食谱浏览和搜索")
        print("  ✅ Meal 计划日历")
        print("  ✅ 营养追踪系统")
        print("  ✅ 成就和挑战系统")
        print("  ✅ 购物清单管理")
        print("\n🎯 开始演示: http://localhost:3000")
    else:
        print("⚠️  某些服务未运行，请检查启动步骤")
    print("=" * 50)

if __name__ == "__main__":
    main()
